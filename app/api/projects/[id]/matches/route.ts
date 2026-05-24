import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type {
  DecideProjectMatchRequest,
  DecideProjectMatchResponse,
} from "@/app/_types/applications";

// POST /api/projects/[id]/matches
// 販売店が、自分の案件に来た応募の中から1社を選んでマッチング成立させる。
// - 選ばれた match: pending -> active
// - 同じ案件の他の match (pending): -> rejected
// - 案件自体: open -> completed
// これら3つを prisma.$transaction でアトミックに実行する。
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DecideProjectMatchResponse>> {
  const { id } = await params;

  try {
    // 1. 認証チェック
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 2. リクエストボディ
    //    matchId が無い・空文字なら 400 で弾く
    //
    // フロントから送られてきたリクエスト本文(JSON)を読み取る。
    // 今回は { matchId: "123" } のようなデータが送られてくる想定。
    //
    // request.json() は Promise を返すため、
    // 後ろに .catch(...) をチェーンしてつなげることができる。
    //
    // .catch(() => ({})) は、
    // 「request.json() が失敗したら、代わりに空オブジェクト {} を返す」という意味。
    //
    // try/catch で書くと、だいたい以下と同じ意味。
    // try {
    //   body = await request.json();
    // } catch {
    //   body = {};
    // }
    //
    // () => ({}) はアロー関数。
    // 「引数を受け取らず、空オブジェクト {} を返す関数」という意味。
    // {} をそのまま書くと「関数の処理ブロック」と解釈されるため、
    // オブジェクトを返すことを明示するために ({}) と丸括弧で囲んでいる。
    //
    // なぜ {} を返すのか？
    // request.json() が失敗した場合でも API 全体を 500 エラーで落とさず、
    // body = {} として後続のバリデーションに流したいため。
    //
    // body = {} になると、body.matchId は undefined になる。
    // その結果、下の if (!body.matchId) が true になり、
    // 「matchId が指定されていません」という 400 エラーを返せる。
    //
    // つまり、
    // 「JSON形式がおかしい・空」などの “入力ミス” を
    // サーバーエラー(500)ではなく、リクエストエラー(400)として扱うための処理。
    const body = (await request
      .json()
      .catch(() => ({}))) as DecideProjectMatchRequest;
    if (!body.matchId) {
      return NextResponse.json(
        { error: "matchId が指定されていません" },
        { status: 400 }
      );
    }

    // 3. 案件を取得（所有者チェック込み）
    //    where に salesUserId: user.id を入れることで、他人の案件は最初から見えない
    const project = await prisma.projects.findFirst({
      where: {
        id: BigInt(id),
        salesUserId: user.id,
        deletedAt: null,
      },
    });
    if (!project) {
      return NextResponse.json({ error: "案件が見つかりません" }, { status: 404 });
    }

    // 4. 案件が募集中であること（completed なら決定済み）
    if (project.status !== "open") {
      return NextResponse.json(
        { error: "この案件はすでにマッチング成立済みです" },
        { status: 409 }
      );
    }

    // 5. 念のため active な match が無いことを確認 (1案件1マッチ制約)
    //    通常は project.status="open" なら無いはずだが、念押しチェック
    const alreadyActive = await prisma.matches.findFirst({
      where: { projectId: project.id, status: "active" },
    });
    if (alreadyActive) {
      return NextResponse.json(
        { error: "この案件はすでにマッチング成立済みです" },
        { status: 409 }
      );
    }

    // 6. 指定された match の存在チェック
    //    - 当該案件に属する pending の match であること
    //    - (他案件の match.id を渡されても projectId 一致で弾ける)
    const target = await prisma.matches.findFirst({
      where: {
        id: BigInt(body.matchId),
        projectId: project.id,
        status: "pending",
      },
    });
    if (!target) {
      return NextResponse.json(
        { error: "対象の応募が見つかりません" },
        { status: 404 }
      );
    }

    // 7. 一括更新を $transaction でアトミックに実行
    //    途中で1つでも失敗すれば全てロールバックされる
    await prisma.$transaction([
      // 選ばれた1件: pending -> active
      prisma.matches.update({
        where: { id: target.id },
        data: { status: "active" },
      }),
      // 同じ案件の他の pending: -> rejected
      prisma.matches.updateMany({
        where: {
          projectId: project.id,
          status: "pending",
          id: { not: target.id },
        },
        data: { status: "rejected" },
      }),
      // 案件: open -> completed
      prisma.projects.update({
        where: { id: project.id },
        data: { status: "completed" },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
