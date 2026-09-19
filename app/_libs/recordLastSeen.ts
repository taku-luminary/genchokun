import { prisma } from "@/app/_libs/prisma";

// 「今アプリを開いた」ことを users.lastSeenAt に記録する（管理ダッシュボードの「最終訪問」に使う）。
// Header の表示のたびに呼ばれるので、直近5分以内に記録済みなら何もしない（書き込みを間引く）。
// 現在時刻を使う処理は、React の「表示の組み立て中に、呼ぶたびに結果が変わる処理を書かない」ルールに合わせて、
// コンポーネントの外のこの関数にまとめている。
export async function recordLastSeen(userId: string) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  await prisma.users.updateMany({
    where: {
      id: userId,
      OR: [
        { lastSeenAt: null }, // まだ一度も記録がない
        { lastSeenAt: { lt: fiveMinutesAgo } }, // 前回記録が5分より前
      ],
    },
    data: { lastSeenAt: new Date() }, // 今の時刻で更新
  });
}
