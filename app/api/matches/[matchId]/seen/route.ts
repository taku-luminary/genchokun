import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";

// 既読API: このマッチのカードを開いた当事者の「既読時刻」を記録する。
// 販売店側なら salesSeenAt、工事店側なら contractorSeenAt に現在時刻を入れる。
type SeenResponse = { success: true } | { error: string };

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
): Promise<NextResponse<SeenResponse>> {
  const { matchId } = await params;

  try {
    // 1. 認証
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 2. マッチを取得（当事者判定と現在の既読状態だけ見れば十分）
    const match = await prisma.matches.findUnique({
      where: { id: BigInt(matchId) },
      select: {
        salesUserId: true,
        contractorUserId: true,
        salesSeenAt: true,
        contractorSeenAt: true,
      },
    });
    if (!match) {
      return NextResponse.json({ error: "マッチが見つかりません" }, { status: 404 });
    }

    // 3. 当事者チェック（販売店側か工事店側か）。第三者には存在自体を隠す
    const isSalesSide = user.id === match.salesUserId;
    const isContractorSide = user.id === match.contractorUserId;
    if (!isSalesSide && !isContractorSide) {
      return NextResponse.json({ error: "マッチが見つかりません" }, { status: 404 });
    }

    // 4. まだ未読なら現在時刻を記録（既読済みなら何もしない＝冪等）
    const alreadySeen = isSalesSide ? match.salesSeenAt : match.contractorSeenAt;
    if (!alreadySeen) {
      await prisma.matches.update({
        where: { id: BigInt(matchId) },
        data: isSalesSide
          ? { salesSeenAt: new Date() }
          : { contractorSeenAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
