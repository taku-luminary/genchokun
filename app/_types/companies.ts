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
  // ▼ 追加: マッチング成立後に相手にのみ公開される連絡先（最低1つ必須はフォーム/API側で担保）
  contactPhone?: string;
  contactEmail?: string;
  contactLineId?: string;
  contactNote?: string;
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
    contactPhone: string | null;
    contactEmail: string | null;
    contactLineId: string | null;
    contactNote: string | null;
  } | null;
};

// 共通: マッチ成立時に相手会社の連絡先を返すための型
// /api/mypage/projects/[id]、/api/projects/[id]、/api/requests/[id] から再利用する
export type CompanyContact = {
  phone: string | null;
  email: string | null;
  lineId: string | null;
  note: string | null;
};
