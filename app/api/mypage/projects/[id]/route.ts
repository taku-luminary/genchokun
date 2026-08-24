import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type { MypageProjectDetailResponse } from "@/app/_types/mypage";
import { buildReviewCardInfo } from "@/app/_libs/reviewCard";
import {
  getCompanyOverallRating,
  getCompanyOverallRatingsByCompanyIds, // ← 追加
} from "@/app/_libs/companyRatings";

// GET /api/mypage/projects/[id]
// 自分が販売店として投稿した案件1件 + その案件への応募一覧を返す。
// 「自分の案件以外」へのアクセスは 404 で返す（存在自体を隠す）。
export async function GET(
   // 第1引数: リクエスト情報。
  // 今回は URL の [id] だけ使えればよく、request 自体は使わない。
  // そのため「使わない引数」であることが分かるように _request という名前にしている。
  _request: NextRequest,

  // 第2引数: Next.js から渡される context オブジェクト。
  // params には動的ルート [id] の値が入る。
  // 例: /api/mypage/projects/123 の場合、params の中に id: "123" が入る。
  //
  // 本来は context.params と書いて取り出せるが、
  // ここでは分割代入を使って { params } と直接取り出している。
  //
  // つまり、以下と同じ意味。
  // function GET(_request, context) {
  //   const params = context.params;
  // }
  //
  // params は Promise なので、型は Promise<{ id: string }> にしている。
  // URL から取得する値は数値に見えても文字列なので、id は string 型になる。
  { params }: { params: Promise<{ id: string }> }

  // この関数は、成功時も失敗時も MypageProjectDetailResponse 型のJSONレスポンスを返す。
): Promise<NextResponse<MypageProjectDetailResponse>> {

   // params は Promise なので await してから、URL の [id] を取り出す。
  // 例: /api/mypage/projects/123 の場合、id には "123" が入る。
  const { id } = await params;

  try {
    // 1. 認証チェック
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 2. 案件を取得（where に salesUserId を入れて、他人の案件は最初から見えない）
    //    matches: pending(未決定) と active(決定済) のみ表示対象にする
    //    contractorUser → company → prefecture まで辿って、応募者の会社名と都道府県を取る
    const project = await prisma.projects.findFirst({
      where: {
        id: BigInt(id),
        salesUserId: user.id,
        deletedAt: null,
      },
      include: {
        prefecture: true,
        // ▼ 追加: 自社情報カード用に、投稿者(=自分)の会社情報を取得する
        salesUser: {
          include: {
            company: { include: { prefecture: true } },
          },
        },
        matches: {
          where: { status: { in: ["pending", "active"] } },
          orderBy: { createdAt: "asc" },
          include: {
            applicationDetail: true,
            contractorUser: {
              include: {
                company: { include: { prefecture: true } },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "案件が見つかりません" }, { status: 404 });
    }
    // ▼  投稿者(自分)の会社情報
    const c = project.salesUser.company;
    const companyRating = c ? await getCompanyOverallRating(c.id.toString()) : null;

    // ▼ 成立済み(active)のマッチがあれば、投稿者(販売店)視点のレビューカードを作る
    const activeMatch = project.matches.find((m) => m.status === "active") ?? null;
    const reviewCard = await buildReviewCardInfo({
      currentUserId: user.id,
      match: activeMatch,
      dateField: project.workEndDate,
    });

    // ▼ 追加: 応募者(工事店)の企業評価をまとめて取得（N+1回避）
    const applicantCompanyIds = project.matches
    .map((m) => m.contractorUser.company?.id.toString())
    .filter((cid): cid is string => cid !== undefined);
    const applicantRatings = await getCompanyOverallRatingsByCompanyIds(applicantCompanyIds);

    // 3. レスポンス整形（BigInt は文字列化、Date は ISO 文字列化）
    return NextResponse.json({
      project: {
        id: project.id.toString(),
        createdAt: project.createdAt.toISOString(),      
        prefecture: { name: project.prefecture.name },
        city: project.city,
        title: project.title,
        workStartDate: project.workStartDate?.toISOString() ?? null,
        workEndDate: project.workEndDate?.toISOString() ?? null,
        summary: project.summary, 
        // ▼ 追加: 調査詳細（詳細ページの調査内容カードで表示する）
        note: project.note,
        paymentCycle: project.paymentCycle,
        rewardType: project.rewardType,
        rewardYen: project.rewardYen === null ? null : Number(project.rewardYen),
        status: project.status,
        // ▼ 変更: null固定 → 自社名（ProjectCard の会社名表示用）
        companyName: c?.name ?? null,        

        // ＝＝＝matches: project.matches.map((m) => ({ status: m.status })), の意味＝＝＝
        // 応募一覧を1件ずつ見て、それぞれの status だけを取り出した新しい配列を作るという意味
        // 「元の matches の情報を、status だけに減らしている」以下例：
        // matches: [
        //   { status: "pending" },
        //   { status: "active" },
        // ]
        // ＝＝＝必要性＝＝＝
        // この詳細ページの JSX 内では直接使っていない。
        // でも型定義 MypageProject で必須になっていて、
        // さらに ProjectCard を一覧・詳細で共通利用するため、APIレスポンスには必要
        // 
        // MypageProject 型では matches が必須フィールドになっているため、
        // ProjectCard に渡す project の形を一覧ページと揃える目的で含める。
        // 詳細ページ本体では applications を使って応募一覧を表示しているが、
        // ProjectCard や一覧ページでは matches の status から
        // 「応募あり」「成立済み」などを判定するため、status だけを返す。
        matches: project.matches.map((m) => ({ status: m.status })), 

        // ▼ 追加: 投稿元(自社)情報カード用。CompanyInfo 型に合わせて整形する。
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
              rating: companyRating,
            }
          : null,

      },

      applications: project.matches.map((m) => ({
        matchId: m.id.toString(),
        status: m.status,
        message: m.applicationDetail?.message ?? null,
        appliedAt: m.createdAt.toISOString(),
        contractor: {
          userId: m.contractorUserId,
          companyId: m.contractorUser.company?.id.toString() ?? null,
          companyName: m.contractorUser.company?.name ?? null,
          companyRating: m.contractorUser.company
            ? applicantRatings.get(m.contractorUser.company.id.toString()) ?? null
            : null, // ← 追加
          prefecture: m.contractorUser.company?.prefecture?.name ?? null,
          contact:
            m.status === "active" && m.contractorUser.company
              ? {
                  phone: m.contractorUser.company.contactPhone,
                  email: m.contractorUser.company.contactEmail,
                  lineId: m.contractorUser.company.contactLineId,
                  note: m.contractorUser.company.contactNote,
                }
              : null,
        },
      })),
      reviewCard,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
