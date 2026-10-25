import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type { RequestDetailResponse, UpdateRequestRequest } from "@/app/_types/requests";
import type { CompanyContact } from "@/app/_types/companies";
import { buildReviewCardInfo } from "@/app/_libs/reviewCard";
import { getCompanyOverallRating } from "@/app/_libs/companyRatings";
import { getRequestInputError, getRewardYenError } from "@/app/_utils/inputValidation";
import { logServerError } from "@/app/_libs/logServerError";
import { ACCEPTED_TERMS_AGREEMENTS_QUERY, hideUnagreedCompanyFields } from "@/app/_libs/companyDisclosure";
import { isTermsAgreementRequired, termsAgreementRequiredResponse } from "@/app/_libs/requireTermsAgreement";

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
            // 投稿者の代表者名と町名・番地・建物名を表示してよいかの判定に使う（同意済みとして扱う記録が1件あるか）
            termsAgreements: ACCEPTED_TERMS_AGREEMENTS_QUERY,
          },
        },
        match: {
          include: {
            salesUser: {
              include: {
                company: { include: { prefecture: true } },
              },
            },
            // 応募時のメッセージ。投稿者に見せる本文だけを取る
            applicationDetail: { select: { message: true } },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "依頼が見つかりません" }, { status: 404 });
    }

    // ログインユーザーの情報をもとに、3つのフラグと2つの連絡先を判定する
    const user = await getAuthUser();
    // proxy.ts でも未ログインは弾いているが、API を直接叩かれた場合に備えて route 内でも確認する
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 投稿者が利用停止中（退会を含む）なら、この依頼に応募した当事者以外には存在を隠す（一覧・企業ページと同じく非公開）。
    // 応募した当事者には、取引の記録として表示を続ける
    if (!request.contractorUser.isActive && request.match?.salesUserId !== user.id) {
      return NextResponse.json({ error: "依頼が見つかりません" }, { status: 404 });
    }

    // 自分がこの依頼の投稿者（工事店）か
    const isMyRequest = user ? user.id === request.contractorUserId : false;

    // 第1.1版の利用制限：当事者でない依頼の詳細は、利用規約への同意のあとに見られる。
    // 自分の依頼と、自分が成立の相手の依頼は、すでに始めた取引の確認として同意の前でも見られる
    if (!isMyRequest && request.match?.salesUserId !== user.id && (await isTermsAgreementRequired(user.id))) {
      return termsAgreementRequiredResponse();
    }

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
    // 応募メッセージは応募者から投稿者に宛てたものなので、連絡先と同じく投稿者にだけ返す
    let applicationMessage: string | null = null;

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
        applicationMessage = request.match.applicationDetail?.message ?? null;
      }
    }

    const c = request.contractorUser.company;

    const companyRating = c ? await getCompanyOverallRating(c.id.toString()) : null;
    
    // ▼ マッチカードのレビュー状態。応募者視点・投稿者視点どちらでも
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
      summary: request.summary,
      note: request.note,
      availableStartDate: request.availableStartDate?.toISOString() ?? null,
      availableEndDate: request.availableEndDate?.toISOString() ?? null,
      rewardType: request.rewardType,
      rewardMinYen: request.rewardMinYen === null ? null : Number(request.rewardMinYen),
      paymentCycle: request.paymentCycle,
      status: request.status,
      // 代表者名と町名・番地・建物名は、投稿者の会員が利用規約に同意した記録がある場合だけ返す（理由は companyDisclosure.ts）
      company: c
        ? hideUnagreedCompanyFields(
            {
              id: c.id.toString(),
              name: c.name,
              prefecture: c.prefecture.name,
              city: c.city,
              address: c.address,
              representativeName: c.representativeName,
              employeeCount: c.employeeCount,
              websiteUrl: c.websiteUrl,
              description: c.description,
              rating: companyRating,
            },
            request.contractorUser.termsAgreements.length > 0
          )
        : null,
      hasApplied,
      isMatched,
      isMyRequest,
      contractorContact,
      salesContact,
      applicationMessage,
      // ▼ 追加: 編集/削除ボタンの表示制御用（PUT/DELETE 時にサーバー側でも再チェックする）
      isEditable,
      reviewCard,
    });
  } catch (e) {
    logServerError("GET /api/requests/[id]", e);
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

    // 第1.1版の利用制限：投稿の編集は、利用規約への同意のあとにできる（応募が届いていない依頼の取り下げ＝DELETE は同意の前でもできる）
    if (await isTermsAgreementRequired(user.id)) {
      return termsAgreementRequiredResponse();
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
    let body: UpdateRequestRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
    }
    // 型と文字数のチェック（都道府県が1件以上あることも含め、作成APIと同じルール）
    const inputError = getRequestInputError(body);
    if (inputError) {
      return NextResponse.json({ error: inputError }, { status: 400 });
    }

    // 報酬の決め方を検証。作成API(/api/requests)と同じルール。
    if (body.rewardType !== "fixed" && body.rewardType !== "negotiable") {
      return NextResponse.json({ error: "報酬金額の決め方が不正です" }, { status: 400 });
    }
    const isNegotiable = body.rewardType === "negotiable";
    const rewardError = isNegotiable ? null : getRewardYenError(body.rewardMinYen);
    if (rewardError) {
      return NextResponse.json({ error: rewardError }, { status: 400 });
    }
    const rewardMinYen = isNegotiable ? null : body.rewardMinYen ?? null;

    await prisma.requests.update({
      where: { id: target.id },
      data: {
        // 編集は connect ではなく set を使う。
        // connect = 追加のみ / set = 渡した配列で丸ごと差し替え（外した県の紐付けは消える）
        prefectures: { set: body.prefectureIds.map((id) => ({ id })) },
        city: body.city ?? null,
        title: body.title,
        summary: body.summary ?? null,
        note: body.note ?? null,
        availableStartDate: body.availableStartDate ? new Date(body.availableStartDate) : null,
        availableEndDate: body.availableEndDate ? new Date(body.availableEndDate) : null,
        rewardType: body.rewardType,
        rewardMinYen: rewardMinYen,
        paymentCycle: body.paymentCycle ?? null,
      },
    });

    return NextResponse.json({ success: true });

  } catch (e) {
    logServerError("PUT /api/requests/[id]", e);
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
    logServerError("DELETE /api/requests/[id]", e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
