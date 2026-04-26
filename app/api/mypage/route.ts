import { NextResponse } from "next/server";
  import { createClient } from "@/app/_libs/supabase/server";
  import { prisma } from "@/app/_libs/prisma";

  export async function GET() {
    // ログイン中のユーザーを確認
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 未ログインなら 401 エラーを返す
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    // 統計数値を取得
    const projectCount = await prisma.projects.count({
      where: { salesUserId: user.id, deleted_at: null },
    });
    const applicationCount = await prisma.matches.count({
      where: { contractorUserId: user.id },
    });
    const todoCount = await prisma.matches.count({
      where: { salesUserId: user.id, status: "pending" },
    });

    // 掲載した工事案件を取得
    const projects = await prisma.projects.findMany({
      where: { salesUserId: user.id, deleted_at: null },
      include: { prefecture: true, matches: true },
      orderBy: { created_at: "desc" },
    });

    // 掲載した工事店依頼を取得
    const requests = await prisma.requests.findMany({
      where: { contractorUserId: user.id, deleted_at: null },
      include: { prefecture: true, match: true },
      orderBy: { created_at: "desc" },
    });

    const data = { stats: { projectCount, applicationCount, todoCount }, projects, requests };

    // ※ Prisma の id は BigInt 型で JSON に変換できないため、文字列に変換して返す
    return new NextResponse(
      JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      ),
      { headers: { "Content-Type": "application/json" } }
    );
  }
  