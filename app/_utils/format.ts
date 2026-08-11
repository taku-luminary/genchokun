// "2026.01.29" 形式に変換
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// "1月31日(土)" 形式に変換
export function formatJpDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`;
}

// 与えられた日時を「日本時間の年月日」文字列(YYYY-MM-DD)に変換する
// timeZone に Asia/Tokyo を明示することで、実行場所(サーバーUTC / ブラウザ)に
// 依存せず常に日本時間の日付として扱える。en-CA は "2026-08-11" 形式で扱いやすい
function toJstYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// 終了日までの残り日数を「日本時間の今日」基準で計算する（nullなら null）
// 今日=0 / 明日=1 / 昨日=-1 になり、期限切れ判定は「< 0」で行う
// 引数は string（APIレスポンス）と Date（Prisma の DateTime）の両方を受ける
export function calcDaysLeft(dateStr: string | Date | null): number | null {
  if (!dateStr) return null;
  const [ey, em, ed] = toJstYmd(new Date(dateStr)).split("-").map(Number);
  const [ty, tm, td] = toJstYmd(new Date()).split("-").map(Number);
  const end = Date.UTC(ey, em - 1, ed);
  const today = Date.UTC(ty, tm - 1, td);
  return Math.round((end - today) / (1000 * 60 * 60 * 24));
}