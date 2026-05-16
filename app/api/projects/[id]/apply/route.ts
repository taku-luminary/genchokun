import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type { CreateProjectApplicationResponse } from "@/app/_types/applications";

// POST /api/projects/[id]/apply
// ログイン中のユーザーが、指定された案件に応募する。
// matches テーブルに status=pending のレコードを1件作成する。
// POST /api/projects/[id]/apply に POST リクエストが来たときに実行される関数。
// Next.js の API Route では、POST(request, context) の形で引数を受け取る。
// 以下はfunction POST( 引数: 引数の型): 戻り値の型 {処理}の形
export async function POST(
  // 第1引数: リクエスト情報。
  // 本来は request.json() などで body を読むときに使う。
  // 今回は body を使わないが、関数の形として受け取っておく必要があるため、未使用を表す _request という名前にしている。
  _request: NextRequest,

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

    // この関数は、成功時 { matchId: string }、失敗時 { error: string } のレスポンスを返す。
): Promise<NextResponse<CreateProjectApplicationResponse>> {

  // params は Promise なので await してから、URL の [id] を取り出す。
  const { id } = await params;

  try {
    // 1. 認証チェック
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 2. 案件を取得（論理削除されていないもの）
    const project = await prisma.projects.findUnique({
      where: { id: BigInt(id), deleted_at: null },
    });
    if (!project) {
      return NextResponse.json({ error: "案件が見つかりません" }, { status: 404 });
    }

    // 3. 募集中（open）以外には応募できない
    if (project.status !== "open") {
      return NextResponse.json({ error: "この案件は募集を終了しています" }, { status: 409 });
    }

    // 3-2. workEndDate が今日以前なら期限切れ扱いで応募不可
    //      （カード表示の「終了」判定と揃える: daysLeft <= 0 が期限切れ）
    // 3-2. 案件の終了日が「今日以前」なら、期限切れとして応募できないようにする
    if (project.workEndDate) {
      // DBに保存されている終了日を、JavaScriptで比較できる Date 型に変換する
      const endDate = new Date(project.workEndDate);

      // 時刻が入っていると日付比較がズレる可能性があるため、
      // 終了日の時刻を 00:00:00.000 にそろえる
      endDate.setHours(0, 0, 0, 0);

      // 今日の日付を取得する
      const today = new Date();

      // 今日も同じく 00:00:00.000 にそろえる
      // これで「時間」ではなく「日付だけ」で比較できる
      today.setHours(0, 0, 0, 0);

      // 終了日が今日以前なら期限切れ
      // 例: 今日が5/16なら、5/16終了の案件も応募不可にする
      if (endDate.getTime() <= today.getTime()) {
        return NextResponse.json(
          { error: "この案件は期限切れです" },
          { status: 409 }
        );
      }
    }

    // 4. 自分が投稿した案件には応募できない
    if (project.salesUserId === user.id) {
      return NextResponse.json({ error: "自分が投稿した案件には応募できません" }, { status: 403 });
    }

    // 5. 重複応募チェック（同じユーザーが既に pending か active で応募していたら不可）
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

    // 6. matches テーブルに pending レコードを作成
    const now = new Date();
    const match = await prisma.matches.create({
      data: {
        projectId: project.id,
        salesUserId: project.salesUserId,
        contractorUserId: user.id,
        status: "pending",
        created_at: now,
        updated_at: now,
      },
    });

    // 7. 成功レスポンス（BigInt は文字列に変換）
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
