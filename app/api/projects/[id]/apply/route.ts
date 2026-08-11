import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import { calcDaysLeft } from "@/app/_utils/format";
import type {
  CreateProjectApplicationRequest,
  CreateProjectApplicationResponse,
} from "@/app/_types/applications";

// POST /api/projects/[id]/apply
// ログイン中の工事店ユーザーが、指定された案件に応募する。
// matches テーブルに status=pending のレコードを作成し、同時に
// application_details テーブルに任意コメント(message)を保存する。
// projects.status は更新しない (販売店が後から応募者を1人選択した時点で
// 別フローで "completed" に変える運用)。
// 以下はfunction POST( 引数: 引数の型): 戻り値の型 {処理}の形
export async function POST(
  // 第1引数: リクエスト情報。
  // body にコメント(message)を含むので request.json() で読む必要がある。
  request: NextRequest,

  // 第2引数: URL などの情報。
  // params には動的ルート [id] の値が入る。
  // 例: /api/projects/123/apply の場合、params の中に id: "123" が入る。
  // 第2引数には、Next.js から context オブジェクトが渡される。
  // context の中には params などの情報が入っている。
  // 本来は context.params と書いて取り出せるが、ここでは分割代入を使って { params } と直接取り出している。
  //   function POST(_request, context) {
  //     const params = context.params;
  //   } と同じ意味。
  { params }: { params: Promise<{ id: string }> }

    // この関数は、成功時 { success: true }、失敗時 { error: string } のレスポンスを返す。
): Promise<NextResponse<CreateProjectApplicationResponse>> {

  // params は Promise なので await してから、URL の [id] を取り出す。
  const { id } = await params;

  try {
    // 1. 認証チェック
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 2. リクエストボディからコメント(message)を取得 (任意項目)
    //    body が空 / JSON でない場合も落とさないよう catch で空オブジェクトに倒す
    //    空白だけのコメントは null として保存する
    const body = (await request
      .json()
      .catch(() => ({}))) as CreateProjectApplicationRequest;
    const message = body.message?.trim() || null;

    // 3. 案件を取得（論理削除されていないもの）
    const project = await prisma.projects.findUnique({
      where: { id: BigInt(id), deletedAt: null },
    });
    if (!project) {
      return NextResponse.json({ error: "案件が見つかりません" }, { status: 404 });
    }

    // 4. 募集中（open）以外には応募できない
    if (project.status !== "open") {
      return NextResponse.json({ error: "この案件は募集を終了しています" }, { status: 409 });
    }

    // 4-2. workEndDate を過ぎていれば期限切れ扱いで応募不可
    //      カード表示の「終了」判定(daysLeft < 0)と揃える
    //      例: 今日が5/17なら、5/17終了の案件は当日まで応募可・5/18から不可
    const daysLeft = calcDaysLeft(project.workEndDate);
    if (daysLeft !== null && daysLeft < 0) {
      return NextResponse.json(
        { error: "この案件は期限切れです" },
        { status: 409 }
      );
    }

    // 5. 自分が投稿した案件には応募できない
    if (project.salesUserId === user.id) {
      return NextResponse.json({ error: "自分が投稿した案件には応募できません" }, { status: 403 });
    }

    // 6. 重複応募チェック（同じユーザーが既に pending か active で応募していたら不可）
    //    案件は複数応募可能だが、「同じユーザーが2回応募する」のは防ぐ
    const existing = await prisma.matches.findFirst({
      where: {
        projectId: project.id,
        contractorUserId: user.id,
        status: { in: ["pending", "active"] },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "すでにこの案件に応募しています" }, { status: 409 });
    }

    // 7. matches + application_details を Prisma のネスト書きで作成する
    //    - 単一の create 呼び出しの中で applicationDetail.create を入れ子にすると、
    //      Prisma が内部で自動的にトランザクションを張ってくれる。
    //      途中で失敗すれば matches も application_details も巻き戻る。
    //    - 即マッチングではなく "pending" で作成する。販売店が後で1人を選んだ時点で
    //      別エンドポイントで "active" に更新する想定 (本ブランチ対象外)。
    //    - リレーション名は schema.prisma の定義 (applicationDetail) に合わせる。
    await prisma.matches.create({
      data: {
        projectId: project.id,
        salesUserId: project.salesUserId,
        contractorUserId: user.id,                  // 応募者 = 工事店(自分)
        status: "pending",                          // 販売店の選択待ち
        applicationDetail: {
          create: { message },                      // 任意コメント、null可
        },
      },
    });

    // 8. 成功レスポンス
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
