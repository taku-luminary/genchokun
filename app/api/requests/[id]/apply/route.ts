import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type {
  CreateRequestApplicationRequest,
  CreateRequestApplicationResponse,
} from "@/app/_types/applications";

// POST /api/requests/[id]/apply
// ログイン中の販売店ユーザーが、指定された依頼待ち(request)に応募する。
// 「依頼待ちへの応募 = 即マッチング」のため、
// matches を status="active" で作成し、同時に application_details にコメントを保存する。
// Next.js の API Route では、POST(request, context) の形で引数を受け取る。
// 以下はfunction POST( 引数: 引数の型): 戻り値の型 {処理}の形
export async function POST(
  // 第1引数: リクエスト情報。
  request: NextRequest,
   // 第2引数: URL などの情報。
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CreateRequestApplicationResponse>> {
  const { id } = await params;

  try {
    // 1. 認証チェック
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 2. リクエストボディからコメントを取得 (任意項目)
    //    body が空 / JSON でない場合も落とさないよう catch で空オブジェクトに倒す
    // request.json()はrequest全体をJSONに変換しているのではなく、requestの中の body だけを読んでJSONに変換する関数
    const body = (await request
      .json()
      .catch(() => ({}))) as CreateRequestApplicationRequest;
    const message = body.message?.trim() || null;

    // 3. 依頼待ちを取得（論理削除されていないもの）
    const target = await prisma.requests.findUnique({
      where: { id: BigInt(id), deletedAt: null },
    });
    if (!target) {
      return NextResponse.json({ error: "依頼が見つかりません" }, { status: 404 });
    }

    // 4. 募集中(open)以外には応募できない
    if (target.status !== "open") {
      return NextResponse.json(
        { error: "この依頼は募集を終了しています" },
        { status: 409 }
      );
    }

    // 5. availableEndDate が今日以前なら期限切れ扱い
    //    時刻による誤判定を避けるため 00:00:00.000 に揃えて比較する
    //    (projects 側 [id]/apply/route.ts と同じロジック)
    if (target.availableEndDate) {
      const endDate = new Date(target.availableEndDate);
      endDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (endDate.getTime() <= today.getTime()) {
        return NextResponse.json(
          { error: "この依頼は期限切れです" },
          { status: 409 }
        );
      }
    }

    // 6. 自分が投稿した依頼には応募できない
    //    依頼を投稿するのは「工事店」なので、その本人が販売店として応募するのは矛盾
    if (target.contractorUserId === user.id) {
      return NextResponse.json(
        { error: "自分が投稿した依頼には応募できません" },
        { status: 403 }
      );
    }

    // 7. 既にマッチング済みなら不可
    //    matches.requestId は @unique のため、依頼ごとに最大1件しか作れない
    //    自分・他人を問わず、誰かが応募した時点で締め切り
    const existing = await prisma.matches.findFirst({
      where: {
        requestId: target.id,
        status: { in: ["pending", "active"] },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "すでにマッチング済みです" },
        { status: 409 }
      );
    }
    
    // 8. 即マッチング: requests.update のネスト書きで
    //    matches + application_details の作成と requests.status の更新を同時に行う。
    //    Prisma の単一呼び出しは内部で自動的にトランザクションになるため、
    //    途中で失敗すれば全てロールバックされ、$transaction と同じ安全性が保たれる。
    //    リレーション名は schema.prisma の定義 (match / applicationDetail) に合わせる。
    await prisma.requests.update({
      where: { id: target.id },
      data: {
        status: "completed",
        match: {
          create: {
            salesUserId: user.id,                      // 応募者 = 販売店(自分)
            contractorUserId: target.contractorUserId, // 被応募者 = 工事店(投稿者)
            status: "active",                          // 即マッチング
            applicationDetail: {
              create: { message },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

