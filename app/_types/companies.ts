// PUT /api/companies/me のリクエスト型（フォームの送信内容）
export type UpdateCompanyRequest = {
  name: string;          // 必須
  prefectureId: number;  // 必須
  city?: string;
  address?: string;
  representativeName?: string;
  employeeCount?: number;
  websiteUrl?: string;
  description?: string;
};

// GET /api/companies/me のレスポンス型
// 未登録のときは company: null を返すので、null も型で表現する
export type CompanyMeResponse = {
  company: {
    id: string;                        // BigInt は文字列で返す（既存パターンに合わせる）
    name: string;
    prefectureId: number;
    prefecture: { name: string };      // 表示用に都道府県名も同梱
    city: string | null;
    address: string | null;
    representativeName: string | null;
    employeeCount: number | null;
    websiteUrl: string | null;
    description: string | null;
    logoImageUrl: string | null;
  } | null;
};