import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type { RequestDetailResponse } from "@/app/_types/requests";
import type { CompanyContact } from "@/app/_types/companies";

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
        prefecture: true,
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

    return NextResponse.json({
      id: request.id.toString(),
      createdAt: request.createdAt.toISOString(),
      prefecture: { name: request.prefecture.name },
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
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
