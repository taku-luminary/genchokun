// 自社情報フォームの入力チェック。
// フォーム（入力欄の下に赤字エラーを出す）と API（フォームを通さず直接呼ばれたときの防御）で同じルールを使う。
// どの関数も、問題があれば画面に出すエラーメッセージ、問題なければ null を返す。
// 空欄は「未入力」として null を返す（必須かどうかは呼び出し側で判定する）

// 電話番号：半角数字とハイフンのみ。
// 番号の始まりで必要な桁数が決まるので、始まりを見て桁数を判定する（「10桁か11桁ならOK」だと携帯の1桁不足を見逃すため）
// - 090・080・070（携帯電話）、050（IP電話）で始まる番号は11桁。0800 のフリーダイヤルもここに含まれる
// - それ以外（固定電話、0120・0570 など）は10桁
export function getPhoneError(value: string | null | undefined): string | null {
  if (!value || value.trim() === "") return null;
  const phone = value.trim();

  if (!/^[0-9-]+$/.test(phone)) {
    return "電話番号は半角数字とハイフン（-）で入力してください";
  }
  const digits = phone.replace(/-/g, "");
  if (!digits.startsWith("0")) {
    return "電話番号は0から始まる番号で入力してください（例：090-1234-5678）";
  }
  if (/^0[5789]0/.test(digits)) {
    if (digits.length !== 11) {
      return "090・080・070・050 から始まる番号は11桁で入力してください（例：090-1234-5678）";
    }
  } else if (digits.length !== 10) {
    return "固定電話などの番号は市外局番から10桁で入力してください（例：03-1234-5678）";
  }
  return null;
}

// メールアドレス：打ち間違いに気付いてもらうための一般的なチェック（「文字@文字.文字」の形で空白を含まない）
export function getEmailError(value: string | null | undefined): string | null {
  if (!value || value.trim() === "") return null;
  const email = value.trim();

  if (!email.includes("@")) {
    return "メールアドレスに「@」が含まれていません";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "メールアドレスの形式が正しくありません（例：info@example.co.jp）";
  }
  return null;
}

// Webサイト URL：http:// または https:// から始まり、空白を含まない
export function getWebsiteUrlError(value: string | null | undefined): string | null {
  if (!value || value.trim() === "") return null;

  if (!/^https?:\/\/\S+\.\S+$/.test(value.trim())) {
    return "WebサイトURLは https:// から始まる形で入力してください（例：https://example.com）";
  }
  return null;
}
