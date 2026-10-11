// サーバーのログ（Vercel の Logs）に残すエラー情報を、個人情報や認証情報を含まない項目に絞る共通関数。
// console.error(e) でエラーをそのまま出すと、次のように入力された値がログに残ることがある。
// - Prisma の入力チェックのエラー：保存しようとした値（連絡先・所在地など）を、メッセージにすべて含む
// - JSON の解析エラー：送られてきた文字列の一部を、メッセージに含む
// そのためメッセージは出さず、エラーの種類（name）・Prisma のエラーコード（code）・発生した場所（stack の at 行）だけを残す。
// context には「どの API の処理か」（例: "PUT /api/companies/me"）を渡し、ログから発生箇所を追えるようにする
export function logServerError(context: string, e: unknown) {
  if (e instanceof Error) {
    const code = "code" in e && typeof e.code === "string" ? e.code : undefined;
    // stack の先頭はメッセージなので使わない。「at ファイル名:行」の行だけを、先頭から5行まで残す
    const where = (e.stack ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("at "))
      .slice(0, 5);
    console.error(`[${context}]`, { name: e.name, code, where });
    return;
  }
  console.error(`[${context}]`, { name: typeof e });
}
