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
      // try catchの目的は、APIでエラーが起きても、返す形式・ログ・ステータスを自分で管理するため
      // getAuthUser, request.json, prisma などは失敗する可能性がある。
      // try の外で失敗すると Next.js のデフォルトHTMLエラーが返り、
      // フロント側の res.json() が失敗して json.error を読めなくなる。
      // その結果、setServerError(json.error) まで処理が進まず、
      // 画面に「サーバーエラーが発生しました」を表示できない。
      // さらにフロント側でも JSON 変換エラーが発生し、
      // 本来見せたいエラー表示ではなく、コンソールエラーや予期しない画面崩れにつながる。
      // そのため、失敗する可能性がある処理は try の中に入れて、
      // catch で必ず JSON 形式のエラーを返す。
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
        // ▼ 追加
        contactPhone: company.contactPhone,
        contactEmail: company.contactEmail,
        contactLineId: company.contactLineId,
        contactNote: company.contactNote,
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

    // ▼ 追加: 連絡先4項目のうち、最低1つは入力されていること（フロントを通さない直叩き防御）
    const contactsFilled = [
      body.contactPhone,
      body.contactEmail,
      body.contactLineId,
      body.contactNote,
    ].some((v) => v && v.trim() !== "");
    if (!contactsFilled) {
      return NextResponse.json(
        { error: "連絡先（電話/メール/LINE/その他）のいずれか1つは必須です" },
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
        // ▼ 追加
        contactPhone:       body.contactPhone ?? null,
        contactEmail:       body.contactEmail ?? null,
        contactLineId:      body.contactLineId ?? null,
        contactNote:        body.contactNote ?? null,
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
        // ▼ 追加
        contactPhone:       body.contactPhone ?? null,
        contactEmail:       body.contactEmail ?? null,
        contactLineId:      body.contactLineId ?? null,
        contactNote:        body.contactNote ?? null,
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