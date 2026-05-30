// マッチング成立後の相手連絡先を表示する共通部品。
// 4箇所（販売店視点 / 工事店視点 / projects経路 / requests経路）から呼び出される。
//
// 親コンポーネントは、API から取得した相手会社の連絡先4項目をそのまま渡せばよい。
// 全部 null の場合は「連絡先が登録されていません」と表示する（相手が連絡先未入力のケース）。

type ContactInfoProps = {
  phone: string | null;
  email: string | null;
  lineId: string | null;
  note: string | null;
};

export function ContactInfo({ phone, email, lineId, note }: ContactInfoProps) {
  // 4項目すべて空 or null なら未登録メッセージを返す
  const hasAny = [phone, email, lineId, note].some(
    (v) => v && v.trim() !== ""
  );

  if (!hasAny) {
    return (
      <p className="text-sm text-slate-400 italic">
        相手の連絡先が登録されていません
      </p>
    );
  }

  // LINE 欄が URL 形式かどうかを判定（http:// または https:// で始まる）
  // URL ならクリック可能なリンクに、そうでなければ単なるテキスト表示にする
  const isLineUrl =
    lineId !== null && /^https?:\/\//.test(lineId.trim());

  return (
    <div className="space-y-2">
      {/* 電話番号: tap で発信 */}
      {phone && (
        <ContactRow icon="📞" label="電話">
          <a
            href={`tel:${phone.trim()}`}
            className="text-brand-green underline break-all"
          >
            {phone}
          </a>
        </ContactRow>
      )}

      {/* メール: tap でメーラー起動 */}
      {email && (
        <ContactRow icon="✉️" label="メール">
          <a
            href={`mailto:${email.trim()}`}
            className="text-brand-green underline break-all"
          >
            {email}
          </a>
        </ContactRow>
      )}

      {/* LINE: URL ならリンク、それ以外はテキスト */}
      {lineId && (
        <ContactRow icon="💬" label="LINE">
          {isLineUrl ? (
            <a
              href={lineId.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-green underline break-all"
            >
              {lineId}
            </a>
          ) : (
            <span className="text-slate-700 break-all">{lineId}</span>
          )}
        </ContactRow>
      )}

      {/* その他: 改行を保持したテキスト */}
      {note && (
        <ContactRow icon="📝" label="その他">
          <span className="text-slate-700 whitespace-pre-wrap break-all">
            {note}
          </span>
        </ContactRow>
      )}
    </div>
  );
}

// 1行分の表示（アイコン + ラベル + 値）を共通化した小さなサブ部品
// 同じファイル内に置くことで使う場所を限定する
function ContactRow({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2 items-start text-sm">
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-bold text-slate-700 w-16 flex-shrink-0">
        {label}
      </span>
      <span className="flex-1">{children}</span>
    </div>
  );
}
