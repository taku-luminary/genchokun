import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import type {CompanyMeResponse,UpdateCompanyRequest,} from "@/app/_types/companies";
// このルート内で使うエラーレスポンス型
type ErrorResponse = {
  error: string;
};

// GET /api/companies/me
// ログイン中ユーザーの会社情報を返す。未登録なら { company: null }
export async function GET(): Promise<NextResponse<CompanyMeResponse | ErrorResponse>> {  
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const company = await prisma.companies.findUnique({
      where: { userId: user.id },
      include: { prefecture: true },
    });

    if (!company) {
      // 未登録 → フォーム側で「新規登録モード」として扱えるよう null を返す
      return NextResponse.json({ company: null });
    }

    return NextResponse.json({
      company: {
        id: company.id.toString(),
        name: company.name,
        prefectureId: company.prefectureId,
        prefecture: { name: company.prefecture.name },
        city: company.city,
        address: company.address,
        representativeName: company.representativeName,
        employeeCount: company.employeeCount,
        websiteUrl: company.websiteUrl,
        description: company.description,
        logoImageUrl: company.logoImageUrl,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// PUT /api/companies/me
// 自社情報を作成 or 更新（upsert）。1ユーザー1社なので新規/編集を1つのAPIで扱える
export async function PUT(request: NextRequest): Promise<NextResponse<{ id: string } | ErrorResponse>> {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const body: UpdateCompanyRequest = await request.json();
    // request.json()は、request.body を読み取って、JSON文字列を JavaScriptオブジェクトに変換する関数

    // 必須項目の最低限チェック（フォーム側でも RHF の required で弾くが、API でも防御）
    if (!body.name || !body.prefectureId) {
      return NextResponse.json(
        { error: "会社名と都道府県は必須です" },
        { status: 400 }
      );
    }

    const company = await prisma.companies.upsert({
      where: { userId: user.id },
      // 既に登録があるとき → 更新
      update: {
        name:               body.name,
        prefectureId:       body.prefectureId,
        city:               body.city ?? null,
        address:            body.address ?? null,
        representativeName: body.representativeName ?? null,
        employeeCount:      body.employeeCount ?? null,
        websiteUrl:         body.websiteUrl ?? null,
        description:        body.description ?? null,
        updated_at:         new Date(),
      },
      // 未登録のとき → 新規作成
      create: {
        userId:             user.id,
        name:               body.name,
        prefectureId:       body.prefectureId,
        city:               body.city ?? null,
        address:            body.address ?? null,
        representativeName: body.representativeName ?? null,
        employeeCount:      body.employeeCount ?? null,
        websiteUrl:         body.websiteUrl ?? null,
        description:        body.description ?? null,
        created_at:         new Date(),
        updated_at:         new Date(),
      },
    });

    return NextResponse.json({ id: company.id.toString() });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}