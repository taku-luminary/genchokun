import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_libs/prisma";
import { getAuthUser } from "@/app/_libs/getAuthUser";
import { isQualificationCode } from "@/app/_constants/qualifications";
import { CREDENTIAL_TEXT_MAX_LENGTH } from "@/app/_constants/companyCredentials";
import { getPhoneError, getEmailError, getWebsiteUrlError } from "@/app/_utils/companyValidation";
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
        contactPhone: company.contactPhone,
        contactEmail: company.contactEmail,
        contactLineId: company.contactLineId,
        contactNote: company.contactNote,
        workExperience: company.workExperience,
        qualifications: company.qualifications,
        qualificationsOther: company.qualificationsOther,
        hasInsurance: company.hasInsurance,
        insuranceNote: company.insuranceNote,
        installerIdManufacturers: company.installerIdManufacturers,
        isInvoiceRegistered: company.isInvoiceRegistered,
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

    if (!body.city || body.city.trim() === "") {
      return NextResponse.json(
        { error: "市区町村を入力してください" },
        { status: 400 }
      );
    }

    // 電話番号・メール・WebサイトURLの形式チェック（フォームと同じルール）。
    // ?? は左が null のときだけ右を実行するので、最初に見つかったエラーだけが返る
    const formatError =
      getPhoneError(body.contactPhone) ??
      getEmailError(body.contactEmail) ??
      getWebsiteUrlError(body.websiteUrl);
    if (formatError) {
      return NextResponse.json({ error: formatError }, { status: 400 });
    }

    // 連絡先4項目のうち、最低1つは入力されていること（フロントを通さない直叩き防御）
    // .some()は配列の値を1つずつ取り出して、関数に渡す、配列の中に、条件に当てはまるものが1つでもあれば trueにするJavaScript の配列メソッド
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

    // 施工体制・資格の入力チェック。不正な値は黙って除外せず、400 で理由を返す
    const credentialsError = validateCredentials(body);
    if (credentialsError) {
      return NextResponse.json({ error: credentialsError }, { status: 400 });
    }

    // 施工体制・資格の保存値。
    // Prisma は値が undefined の項目を「指定なし」として扱うので、
    // 項目自体が送られていない場合、update では既存値がそのまま残り、create では DB の初期値（null / 空配列）が入る
    const credentials = {
      workExperience: normalizeCredentialText(body.workExperience),
      qualifications: body.qualifications,
      qualificationsOther: normalizeCredentialText(body.qualificationsOther),
      hasInsurance: body.hasInsurance,
      // 「加入なし」「まだ選んでいない」が明示的に送られたときだけ保険の内容を消す（加入なしなのに内容が残る矛盾を防ぐ）
      insuranceNote:
        body.hasInsurance === false || body.hasInsurance === null
          ? null
          : normalizeCredentialText(body.insuranceNote),
      installerIdManufacturers: normalizeCredentialText(body.installerIdManufacturers),
      isInvoiceRegistered: body.isInvoiceRegistered,
    };

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
        contactPhone:       body.contactPhone ?? null,
        contactEmail:       body.contactEmail ?? null,
        contactLineId:      body.contactLineId ?? null,
        contactNote:        body.contactNote ?? null,
        ...credentials,
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
        contactPhone:       body.contactPhone ?? null,
        contactEmail:       body.contactEmail ?? null,
        contactLineId:      body.contactLineId ?? null,
        contactNote:        body.contactNote ?? null,
        ...credentials,
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

// 施工体制・資格の入力チェック。問題があれば画面に出すエラーメッセージ、問題なければ null を返す。
// body の型は UpdateCompanyRequest だが、API を直接呼ばれると違う型の値が届き得るので、実行時にも型を確かめる。
// undefined（項目が送られていない）は正常として通す
function validateCredentials(body: UpdateCompanyRequest): string | null {
  const texts = [
    { label: "工事区分／経験年数", value: body.workExperience },
    { label: "その他の資格・講習／補足", value: body.qualificationsOther },
    { label: "保険の内容", value: body.insuranceNote },
    { label: "施工ID保有メーカー", value: body.installerIdManufacturers },
  ];
  for (const text of texts) {
    if (text.value === undefined || text.value === null) continue;
    if (typeof text.value !== "string") {
      return `${text.label}の入力内容が正しくありません`;
    }
    if (text.value.length > CREDENTIAL_TEXT_MAX_LENGTH) {
      return `${text.label}は${CREDENTIAL_TEXT_MAX_LENGTH}文字以内で入力してください`;
    }
  }

  // 配列であること、中身がすべて定数に存在する資格コードであること
  if (body.qualifications !== undefined) {
    if (!Array.isArray(body.qualifications) || !body.qualifications.every(isQualificationCode)) {
      return "保有資格・講習修了の選択内容が正しくありません";
    }
  }

  const choices = [
    { label: "工事保険", value: body.hasInsurance },
    { label: "インボイス登録", value: body.isInvoiceRegistered },
  ];
  for (const choice of choices) {
    if (choice.value === undefined || choice.value === null) continue;
    if (typeof choice.value !== "boolean") {
      return `${choice.label}の選択内容が正しくありません`;
    }
  }

  return null;
}

// 自由記入欄の整形。前後の空白・改行を取り除き、空になったら null（未入力）として保存する。
// undefined（項目が送られていない）はそのまま返し、update で既存値を残す
function normalizeCredentialText(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
