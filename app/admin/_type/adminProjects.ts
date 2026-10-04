// 画面に出す案件の状態。
// DB の projects.status は open / completed の2値しかなく、「削除された」
// 「期限切れで終わった」「応募が来ている」を表せない。そのため deletedAt・
// workEndDate・matches を合わせて、表示用に1つへ畳んだ区分を用意する。
// 画面では hasApplicants と open をどちらも「募集中」と出す（応募の有無は応募列で分かる）。
export type AdminProjectState =
  | "deleted" // 掲載者が取り下げた
  | "matched" // active な応募がある（＝マッチ成立）
  | "expiredClosed" // 作業完了日を過ぎたが成立しなかった
  | "hasApplicants" // 募集中で応募あり（掲載者の決定待ち）
  | "open"; // 募集中・応募0

// 管理者が次に取るべきフォローと、その優先度。
// 判定も文言も route.ts 側で作り、画面はそれを描くだけにする。
// 2箇所に分けると概況の数字と食い違う原因になるため。
export type AdminProjectFollowUp = {
  priority: number; // 1〜6。小さいほど先に手を打つ
  label: string; // 上段＝管理者が取る行動（例「応募を知らせる」）
  sub: string | null; // 下段＝理由と期限（例「応募3件・掲載者は未訪問」）
  // 色の意味。赤を増やすと「赤が付いた行＝必ず手を打つ行」という読み方が崩れるので慎重に。
  //   red         … 放っておくと不成立が確定する／すでに不成立になった
  //   amber       … 急がないが連絡したい
  //   green       … 本日掲載。すぐに全ユーザーへ周知する
  //   slateStrong … やることはあるが急がない（周知が行き届いていない可能性）
  //   slate       … 対応不要
  tone: "red" | "amber" | "green" | "slateStrong" | "slate";
};

export type AdminProjectApplicant = {
  matchId: string; // BigInt を文字列化
  status: "pending" | "active" | "rejected" | "cancelled";
  appliedAt: string; // ISO（応募日時）
  companyId: string | null; // null＝会社未登録。リンクを張らない
  companyName: string | null;
  // ▼ companies（自社情報）に登録された連絡先。
  //   落選者へ電話でフォローするために使うので、電話とLINEも返す。
  contactPhone: string | null;
  contactEmail: string | null;
  contactLineId: string | null;
  contactNote: string | null;
  // ▼ users（認証）のメール。ログイン・会員登録に使うもので、上の連絡先とは別物。
  loginEmail: string | null;
  message: string | null; // 応募コメント全文（モーダルで表示）
  // この会社の「案件への応募」累計。
  // 依頼(requests)は応募＝即成立で落選が起きないため含めない。
  stats: {
    applied: number;
    won: number;
    lost: number;
    // 直近で連続して落選している回数。結果待ち(pending)は飛ばして数える
    rejectStreak: number;
  };
};

export type AdminProjectRow = {
  projectId: string;
  title: string;
  createdAtJst: string; // "YYYY-MM-DD"（掲載日の表示用。日本時間基準）
  createdAt: string; // ISO（並び替え用）
  workStartDate: string | null; // "YYYY-MM-DD"
  workEndDate: string | null; // "YYYY-MM-DD"
  daysLeft: number | null; // 作業完了日までの残り日数。負＝期限切れ / null＝未設定
  state: AdminProjectState;
  isDeleted: boolean; // 削除済みを画面側で出し入れする判定用

  salesUser: {
    companyId: string | null;
    companyName: string | null;
    // ▼ companies（自社情報）に登録された連絡先
    contactPhone: string | null;
    contactEmail: string | null;
    contactLineId: string | null;
    contactNote: string | null;
    // ▼ users（認証）のメール。ログイン・会員登録に使うもので、上の連絡先とは別物
    loginEmail: string | null;
    // 連絡先モーダルに出す投稿実績。「決めない癖」があるかを電話前に把握する
    postTotal: number;
    postWon: number;
    postLost: number;
    postOpen: number;
    lastSeenAt: string | null; // 最終訪問（訪問状況の根拠をツールチップに出す）
  };

  lastAppliedAt: string | null; // 最新の応募日時（訪問状況の根拠）
  // 訪問状況。最新の応募が届いたあとに掲載者がアプリを開いたか。応募0なら null。
  // false は「応募を見たはずがない」と断定できるが、true は「アプリを開いた」までで
  // その応募を実際に見たかは分からない（元データが全ページ共通の最終訪問のため）。
  visitedAfterApply: boolean | null;

  applicantCount: number; // 応募が来た総数（落選を含む）
  pendingCount: number;
  rejectedCount: number;
  waitDays: number | null; // 最初の未決定応募からの経過日数

  followUp: AdminProjectFollowUp;
  applicants: AdminProjectApplicant[]; // 申込順（応募日時の昇順）
};

export type AdminProjectsResponse = { projects: AdminProjectRow[] };
