import { prisma } from "@/app/_libs/prisma";

// ログイン中ユーザーの会社を返す（未登録なら null）。
// 存在チェックが目的なので id だけ取得して軽くする。
export async function findCompanyByUserId(userId: string) {
  return prisma.companies.findUnique({
    where: { userId },
    select: { id: true },
  });
}
