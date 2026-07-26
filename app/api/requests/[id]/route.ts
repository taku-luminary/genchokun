import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type { RequestDetailResponse, UpdateRequestRequest } from "@/app/_types/requests";
import type { CompanyContact } from "@/app/_types/companies";
import { buildReviewCardInfo } from "@/app/_libs/reviewCard";


// エラーレスポンス型を明示しておくことで、as never で型エラーをごまかさずに済む
type ErrorResponse = { error: string };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<RequestDetailResponse | ErrorResponse>> {
  const { id } = await params;

  try {
    // ▼ 変更: 既存は match を別クエリで取得していたが、include で1クエリにまとめる。
    //   match → salesUser → company まで辿って、マッチした販売店の連絡先を取得できるようにする。
    //   matches.requestId は @unique なので match は最大1件しか存在しない。
    const request = await prisma.requests.findUnique({
      where: { id: BigInt(id), deletedAt: null },
      include: {
        // ▼ 追加: 対応可能エリア（複数）。id 昇順で取得して表示順を安定させる
        prefectures: { orderBy: { id: "asc" } },
        contractorUser: {
          include: {
            company: {
              include: { prefecture: true },
            },
          },
        },
        match: {
          include: {
            salesUser: {
              include: {
                company: { include: { prefecture: true } },
              },
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "依頼が見つかりません" }, { status: 404 });
    }

    // ログインユーザーの情報をもとに、3つのフラグと2つの連絡先を判定する
    const user = await getAuthUser();

    // 自分がこの依頼の投稿者（工事店）か
    const isMyRequest = user ? user.id === request.contractorUserId : false;

    // この依頼に既にマッチが成立しているか
    // matches.requestId は @unique のため最大1件。pending/active のみ「成立中」扱い。
    const isMatched = request.match
      ? ["pending", "active"].includes(request.match.status)
      : false;

    // 自分(販売店)が応募済みかどうか
    // 即マッチなので「応募 = match.salesUserId === user.id」と等価
    const hasApplied = !!(
      user &&
      request.match &&
      request.match.salesUserId === user.id &&
      ["pending", "active"].includes(request.match.status)
    );
     // ▼ 追加: 投稿者本人 && まだマッチが入っていない(open) ときだけ編集/削除可。
    //   requests は応募＝即マッチで status が completed になるため、open チェックで
    //   「まだ誰の応募も受けていない」を表現できる。
    const isEditable = isMyRequest && request.status === "open";


    // ▼ 連絡先の出し分け
    // requests は即マッチなので match.status は通常 active のみ。
    // active のときだけ、相手の連絡先を出す（プライバシー保護）。
    let contractorContact: CompanyContact | null = null;
    let salesContact: CompanyContact | null = null;

    if (request.match?.status === "active") {
      // 応募者視点: 自分が応募者 → 工事店（投稿者）の連絡先を渡す
      if (hasApplied) {
        const cc = request.contractorUser.company;
        if (cc) {
          contractorContact = {
            phone: cc.contactPhone,
            email: cc.contactEmail,
            lineId: cc.contactLineId,
            note: cc.contactNote,
          };
        }
      }
      // 投稿者視点: 自分の依頼にマッチ → 販売店（応募者）の連絡先を渡す
      if (isMyRequest) {
        const sc = request.match.salesUser.company;
        if (sc) {
          salesContact = {
            phone: sc.contactPhone,
            email: sc.contactEmail,
            lineId: sc.contactLineId,
            note: sc.contactNote,
          };
        }
      }
    }

    const c = request.contractorUser.company;
    // ▼ 追加: マッチカードのレビュー状態。応募者視点・投稿者視点どちらでも
    //   buildReviewCardInfo がログイン中ユーザーの立場を見て役割を決める。
    const reviewCard = await buildReviewCardInfo({
      currentUserId: user?.id ?? null,
      match: request.match,
      dateField: request.availableEndDate,
    });

    return NextResponse.json({
      id: request.id.toString(),
      createdAt: request.createdAt.toISOString(),
      // 対応可能エリア（複数）。id は編集フォームの初期値用、name は表示用
      prefectures: request.prefectures.map((p) => ({ id: p.id, name: p.name })),
      city: request.city,
      title: request.title,
      investigationSummary: request.investigationSummary,
      investigationDetails: request.investigationDetails,
      availableStartDate: request.availableStartDate?.toISOString() ?? null,
      availableEndDate: request.availableEndDate?.toISOString() ?? null,
      rewardMinYen: request.rewardMinYen === null ? null : Number(request.rewardMinYen),
      paymentCycle: request.paymentCycle,
      status: request.status,
      company: c
        ? {
            id: c.id.toString(), 
            name: c.name,
            prefecture: c.prefecture.name,
            city: c.city,
            address: c.address,
            representativeName: c.representativeName,
            employeeCount: c.employeeCount,
            websiteUrl: c.websiteUrl,
            description: c.description,
          }
        : null,
      hasApplied,
      isMatched,
      isMyRequest,
      contractorContact,
      salesContact,
      // ▼ 追加: 編集/削除ボタンの表示制御用（PUT/DELETE 時にサーバー側でも再チェックする）
      isEditable,
      reviewCard,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: true } | ErrorResponse>> {
  const { id } = await params;

  try {
    // 1. ログイン確認
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 2. 所有者＋存在確認（本人の依頼だけがヒット。他人/削除済みは 404）
    const target = await prisma.requests.findFirst({
      where: { id: BigInt(id), contractorUserId: user.id, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!target) {
      return NextResponse.json({ error: "依頼が見つかりません" }, { status: 404 });
    }

    // 3. 編集可否をサーバー側で再チェック。
    //    requests は応募＝即マッチで status が completed になるため、open 以外は編集不可。
    if (target.status !== "open") {
      return NextResponse.json(
        { error: "マッチング済みのため編集できません" },
        { status: 409 }
      );
    }
    // 4. 更新。正規化ルールは新規作成API(/api/requests)と同じ。
    const body: UpdateRequestRequest = await request.json();
    if (!Array.isArray(body.prefectureIds) || body.prefectureIds.length === 0) {
      return NextResponse.json({ error: "都道府県を1つ以上選択してください" }, { status: 400 });
    }
    await prisma.requests.update({
      where: { id: target.id },
      data: {
        // 編集は connect ではなく set を使う。
        // connect = 追加のみ / set = 渡した配列で丸ごと差し替え（外した県の紐付けは消える）
        prefectures: { set: body.prefectureIds.map((id) => ({ id })) },
        city: body.city ?? null,
        title: body.title,
        investigationSummary: body.investigationSummary ?? null,
        investigationDetails: body.investigationDetails ?? null,
        availableStartDate: body.availableStartDate ? new Date(body.availableStartDate) : null,
        availableEndDate: body.availableEndDate ? new Date(body.availableEndDate) : null,
        rewardMinYen: body.rewardMinYen ?? null,
        paymentCycle: body.paymentCycle ?? null,
      },
    });

    return NextResponse.json({ success: true });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: true } | ErrorResponse>> {
  const { id } = await params;

  try {
    // 1. ログイン確認
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 2. 所有者＋存在確認（本人の依頼だけがヒット。他人/削除済みは 404）
    const target = await prisma.requests.findFirst({
      where: { id: BigInt(id), contractorUserId: user.id, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!target) {
      return NextResponse.json({ error: "依頼が見つかりません" }, { status: 404 });
    }

    // 3. 削除可否を再チェック。requests は応募＝即マッチで status が completed になるため open 以外は不可。
    if (target.status !== "open") {
      return NextResponse.json({ error: "マッチング済みのため削除できません" }, { status: 409 });
    }

    // 4. 論理削除
    await prisma.requests.update({
      where: { id: target.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
