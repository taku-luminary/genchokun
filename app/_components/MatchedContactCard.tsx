import { ContactInfo } from '@/app/_components/ContactInfo';
import type { CompanyContact } from '@/app/_types/companies';

// マッチング成立時に表示する「緑のカード」の共通コンポーネント。
// 使用箇所:
//   - projects/[id]        : 工事店視点（あなたが選ばれました）
//   - mypage/projects/[id] : 販売店視点（マッチング成立済み）
//   - requests/[id]        : 応募者視点・投稿者視点の2箇所
type MatchedContactCardProps = {
  /** カード先頭の見出し（例: "🎉 あなたが選ばれました"） */
  title: string;
  /** 見出しの下の説明文（不要なら省略可） */
  description?: string;
  /** 連絡先の上に出すラベル（例: "販売店の連絡先" → "━ 販売店の連絡先 ━" と表示） */
  contactLabel: string;
  /**
   * 相手の連絡先。マッチ成立時のみAPIから値が返る。
   * null は「相手が連絡先未登録」のケース（ContactInfo 側で案内文を表示）。
   */
  contact: CompanyContact | null;
  /** 連絡先の手前に差し込みたい追加コンテンツ（相手の会社名・応募メッセージなど） */
  children?: React.ReactNode;
};

/**
 * マッチング成立時に表示する「緑のカード」の共通コンポーネント。
 *
 * 使用箇所:
 * - projects/[id]        : 工事店視点（あなたが選ばれました）
 * - mypage/projects/[id] : 販売店視点（マッチング成立済み）
 * - requests/[id]        : 応募者視点・投稿者視点の2箇所
 */
export function MatchedContactCard({
  title,
  description,
  contactLabel,
  contact,
  children,
}: MatchedContactCardProps) {
  return (
    <section className="bg-brand-bg border-2 border-brand-green/30 rounded-2xl p-6 space-y-3">
      {/* タイトル: 案件カードのタイトルと同じ text-lg md:text-2xl に */}
      <p className="text-lg md:text-2xl font-bold text-brand-green">{title}</p>
      {/* 説明: 案件カードの本文と同じ ベースサイズ font-medium に */}
      {description && <p className="text-slate-700 font-medium">{description}</p>}
      <div className="border-t border-brand-green/30 pt-3 mt-3">
        {children && <div className="mb-3">{children}</div>}
        {/* 連絡先ラベル: ラベル基準の text-sm font-bold に */}
        <p className="text-sm font-bold text-slate-700 mb-4">
          ━ {contactLabel} ━
        </p>
        <ContactInfo
          phone={contact?.phone ?? null}
          email={contact?.email ?? null}
          lineId={contact?.lineId ?? null}
          note={contact?.note ?? null}
        />
      </div>
    </section>
  );


}
