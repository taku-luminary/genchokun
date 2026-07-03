import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type { CompanyPublicResponse } from "@/app/_types/companies";
import type { InterviewArticlePublic } from "@/app/_types/articles";

type ErrorResponse = { error: string };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CompanyPublicResponse | ErrorResponse>> {
  try {
    const { id } = await params;

    const company = await prisma.companies.findUnique({
      where: { id: BigInt(id) },
      include: {
        prefecture: true,
        // 記事とそのブロックも一緒に取得（1企業1記事）
        interviewArticle: { include: { blocks: true } },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "企業が見つかりません" }, { status: 404 });
    }

    // 閲覧者の状態（未ログインなら両方 false）
    const user = await getAuthUser();
    let isMyCompany = false;
    let isAdmin = false;
    if (user) {
      isMyCompany = user.id === company.userId;
      const dbUser = await prisma.users.findUnique({
        where: { id: user.id },
        select: { isAdmin: true },
      });
      isAdmin = dbUser?.isAdmin ?? false;
    }

    // 公開中（published）の記事だけを、セクションごとの本文に均して返す
    let article: InterviewArticlePublic | null = null;
    const a = company.interviewArticle;
    if (a && a.status === "published") {
      const companyIntroText =
        a.blocks.find(
          (b) => b.sectionKey === "company_intro" && b.blockType === "text"
        )?.textContent ?? null;
      const workStyleText =
        a.blocks.find(
          (b) => b.sectionKey === "work_style" && b.blockType === "text"
        )?.textContent ?? null;
      article = {
        title: a.title,
        introText: a.introText,
        companyIntroText,
        workStyleText,
      };
    }

    return NextResponse.json({
      id: company.id.toString(),
      company: {
        id: company.id.toString(),
        name: company.name,
        prefecture: company.prefecture.name,
        city: company.city,
        address: company.address,
        representativeName: company.representativeName,
        employeeCount: company.employeeCount,
        websiteUrl: company.websiteUrl,
        description: company.description,
      },
      logoImageUrl: company.logoImageUrl,
      isMyCompany,
      isAdmin,
      article,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
