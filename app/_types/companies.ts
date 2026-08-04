import type { InterviewArticlePublic } from "./articles"; 
import type { CompanyRatingSummary } from "@/app/_libs/companyRatings"; // ← 追加


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

// 詳細ページなどで表示する「投稿元の会社情報」カード用の共通型。
// projects/[id]・requests/[id]・mypage/projects/[id] で共用する。
export type CompanyInfo = {
  id: string;          // ← 追加: 企業ページ /companies/[id] へのリンク用
  name: string;
  prefecture: string;
  city: string | null;
  address: string | null;
  representativeName: string | null;
  employeeCount: number | null;
  websiteUrl: string | null;
  description: string | null;
  //  会社の評価。役割ごとに平均を分けて持つ（片方だけ・両方nullもあり得る）。
  //   工事店として受けた評価 / 販売店として受けた評価。任意（optional）なので
  //   まだ集計を積んでいない呼び出し元でも型エラーにならない。集計は 3-2 で入れる。
  //  変更: 役割別2枠 → 工事店/販売店を合算した単一の総合評価。0件なら null。
  rating?: CompanyRatingSummary | null
};


// GET /api/companies/[id] のレスポンス型（公開企業ページ用）
// 連絡先（contactPhone/Email/LineId/Note）は公開しないので含めない。
// 表示は既存の CompanyInfoCard を再利用するため、CompanyInfo をそのまま使う。
export type CompanyPublicResponse = {
  id: string;
  company: CompanyInfo;
  logoImageUrl: string | null;
  isMyCompany: boolean;        // ←  閲覧者がこの企業のオーナー本人か
  isAdmin: boolean;                        //  管理者に編集導線を出すため
  article: InterviewArticlePublic | null;  //  公開中の記事（published のみ）
};