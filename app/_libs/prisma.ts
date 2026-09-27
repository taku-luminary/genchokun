import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  // DB に接続できないとき、指定がないと OS 任せで 100 秒以上待ってから失敗する。
  // 通常の接続は 1 秒もかからないため、5 秒で打ち切って早くエラーを返す
  connectionTimeoutMillis: 5000,
})

export const prisma = new PrismaClient({ adapter })