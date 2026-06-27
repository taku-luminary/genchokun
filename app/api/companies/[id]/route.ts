import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";   // ← 追加
import type { CompanyPublicResponse } from "@/app/_types/companies";

type ErrorResponse = {
  error: string;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CompanyPublicResponse | ErrorResponse>> {
  try {
    const { id } = await params;

    const company = await prisma.companies.findUnique({

      where: { id: BigInt(id) },
      include: { prefecture: true },
    });

    if (!company) {
      return NextResponse.json({ error: "企業が見つかりません" }, { status: 404 });
    }

    // 閲覧者がこの企業のオーナー本人か（未ログインなら false）
    const user = await getAuthUser();
    const isMyCompany = user ? user.id === company.userId : false;

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
      isMyCompany,           // ← 追加
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
