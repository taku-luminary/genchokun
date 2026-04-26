import { createClient } from "@/app/_libs/supabase/server";
import { prisma } from "@/app/_libs/prisma";

// ============================================================
// 日付フォーマット関数
// ============================================================

// "2026.01.29" 形式に変換
function formatDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// "1月31日(土)" 形式に変換
function formatJpDate(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`;
}

// ============================================================
// カードコンポーネント
// ※ 工事案件・工事店どちらのカードもこれ1つで表示する
// ============================================================

type MypageCardProps = {
  postedAt: Date;        // 投稿日
  prefecture: string;    // 都道府県
  city: string | null;   // 市区町村
  dateRange: string;     // 作業日程（例: "1月31日(土)〜2月1日(日)"）
  summary: string | null;    // 調査可能内容
  paymentCycle: string | null; // 支払サイクル
  rewardYen: number | null;  // 報酬（円）
  isCompleted: boolean;  // true なら "終了"、false なら "募集中"
  hasMatch: boolean;     // true なら "マッチング済み" を表示
};

function MypageCard({
  postedAt,
  prefecture,
  city,
  dateRange,
  summary,
  paymentCycle,
  rewardYen,
  isCompleted,
  hasMatch,
}: MypageCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl p-6 card-shadow border relative overflow-hidden ${
        isCompleted ? "border-red-200" : "border-slate-50"
      }`}
    >
      {/* カード上部：投稿日・場所・ステータスバッジ */}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">
            {formatDate(postedAt)}
          </p>
          <div className="flex items-center text-slate-700 font-bold">
            <span className="mr-1">›</span>
            <span>{prefecture} {city}</span>
          </div>
        </div>
        <span
          className={`px-4 py-1 md:px-6 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold text-white ${
            isCompleted ? "bg-slate-500" : "bg-brand-green"
          }`}
        >
          {isCompleted ? "終了" : "募集中"}
        </span>
      </div>

      {/* カード下部：日程・詳細・マッチング済みバッジ */}
      <div className="flex gap-4">
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-4 text-brand-green">
            {dateRange}
          </h3>
          <div className="space-y-2 text-slate-700 font-medium">
            <p>・調査可能内容：{summary ?? "—"}</p>
            <p>
              ・希望：{paymentCycle ?? "—"}
              {rewardYen ? `（${rewardYen.toLocaleString()}円）` : ""}
            </p>
          </div>
        </div>

        {/* マッチング済みのときだけ表示 */}
        {hasMatch && (
          <div className="flex-shrink-0 w-24 border-2 border-brand-green rounded-xl flex items-center justify-center">
            <p className="text-xs font-bold text-brand-green text-center leading-snug px-1">
              マッチング済み
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ページ本体
// ============================================================

export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // URLパラメータ（?tab=projects など）を取得。省略時は "projects"
  const { tab = "projects" } = await searchParams;

  // ログイン中のユーザーを取得
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // ============================================================
  // DBからデータを取得
  // ============================================================

  // 統計グリッド用の件数
  const projectCount = await prisma.projects.count({
    where: { salesUserId: user.id, deleted_at: null },
  });
  const applicationCount = await prisma.matches.count({
    where: { contractorUserId: user.id },
  });
  const todoCount = await prisma.matches.count({
    where: { salesUserId: user.id, status: "pending" },
  });

  // タブが "projects" のときだけ工事案件を取得（"requests" のときは空配列）
  const myProjects =
    tab === "projects"
      ? await prisma.projects.findMany({
          where: { salesUserId: user.id, deleted_at: null },
          include: { prefecture: true, matches: true },
          orderBy: { created_at: "desc" },
        })
      : [];

  // タブが "requests" のときだけ工事店依頼を取得（"projects" のときは空配列）
  const myRequests =
    tab === "requests"
      ? await prisma.requests.findMany({
          where: { contractorUserId: user.id, deleted_at: null },
          include: { prefecture: true, match: true },
          orderBy: { created_at: "desc" },
        })
      : [];

  // ============================================================
  // 画面表示
  // ============================================================

  return (
    <>
      {/* ========== 上部：白背景エリア ========== */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-6 space-y-6">

          <h1 className="text-2xl md:text-3xl font-black text-center text-slate-800">
            マイページ
          </h1>

          {/* 統計グリッド（3マス） */}
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">

            {/* やること（左・2行分） */}
            <div className="bg-red-50 rounded-2xl p-4 md:p-6 row-span-2 flex flex-col justify-between">
              <div>
                <p className="font-black text-slate-700">やること</p>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  マッチング・応募されている案件
                </p>
              </div>
              <p className="text-5xl md:text-6xl font-black text-red-400 mt-4">
                {todoCount}
                <span className="text-2xl ml-1">件</span>
              </p>
            </div>

            {/* 掲載した案件（右上） */}
            <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 card-shadow">
              <p className="text-sm md:text-base text-slate-600">
                あなたが<strong>掲載</strong>した案件
              </p>
              <p className="text-3xl md:text-4xl font-black text-slate-800 mt-2">
                {projectCount}
                <span className="text-xl ml-1">件</span>
              </p>
            </div>

            {/* 応募した案件（右下） */}
            <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 card-shadow">
              <p className="text-sm md:text-base text-slate-600">
                あなたが<strong>応募</strong>した案件
              </p>
              <p className="text-3xl md:text-4xl font-black text-slate-800 mt-2">
                {applicationCount}
                <span className="text-xl ml-1">件</span>
              </p>
            </div>
          </div>

          {/* セクション見出し */}
          <p className="text-center text-slate-600 font-bold">
            ーーあなたが掲載した案件ーー
          </p>

          {/* タブ切り替え（クリックでURLが変わり、表示が切り替わる） */}
          <div className="bg-slate-100 p-1.5 md:p-2 rounded-2xl md:rounded-3xl flex max-w-2xl mx-auto shadow-inner">
            <a
              href="?tab=projects"
              className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-xl font-black transition-all 
duration-300 text-center ${
                tab === "projects"
                  ? "bg-brand-green text-white shadow-lg scale-[1.02]"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/60"
              }`}
            >
              募集中の工事案件
            </a>
            <a
              href="?tab=requests"
              className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-xl font-black transition-all 
duration-300 text-center ${
                tab === "requests"
                  ? "bg-brand-green text-white shadow-lg scale-[1.02]"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/60"
              }`}
            >
              お仕事待ちの工事店
            </a>
          </div>
        </div>
      </section>

      {/* ========== 下部：グレー背景エリア（カード一覧） ========== */}
      <section className="bg-[#e8e8e8]">
        <div className="max-w-4xl mx-auto px-4 pt-4 md:pt-6 pb-8">
          <div className="space-y-3 md:space-y-5">

            {/* 工事案件タブの一覧 */}
            {tab === "projects" && (
              <>
                {myProjects.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">
                    掲載した案件はありません
                  </p>
                ) : (
                  myProjects.map((project) => (
                    <MypageCard
                      key={project.id.toString()}
                      postedAt={project.created_at}
                      prefecture={project.prefecture.name}
                      city={project.city}
                      dateRange={
                        project.workStartDate && project.workEndDate
                          ? `${formatJpDate(project.workStartDate)}〜${formatJpDate(project.workEndDate)}`
                          : "日程未定"
                      }
                      summary={project.investigationSummary}
                      paymentCycle={project.paymentCycle}
                      rewardYen={project.rewardYen}
                      isCompleted={project.status === "completed"}
                      hasMatch={project.matches.some((m) => m.status === "active")}
                    />
                  ))
                )}
              </>
            )}

            {/* 工事店タブの一覧 */}
            {tab === "requests" && (
              <>
                {myRequests.length === 0 ? (
                  <p className="text-center text-slate-500 py-10">
                    掲載した依頼待ちはありません
                  </p>
                ) : (
                  myRequests.map((request) => (
                    <MypageCard
                      key={request.id.toString()}
                      postedAt={request.created_at}
                      prefecture={request.prefecture.name}
                      city={request.city}
                      dateRange={
                        request.availableStartDate && request.availableEndDate
                          ? `${formatJpDate(request.availableStartDate)}〜${formatJpDate(request.availableEndDate)}`
                          : "日程未定"
                      }
                      summary={request.investigationSummary}
                      paymentCycle={request.paymentCycle}
                      rewardYen={request.rewardMinYen}
                      isCompleted={request.status === "completed"}
                      hasMatch={request.match?.status === "active"}
                    />
                  ))
                )}
              </>
            )}

          </div>
        </div>
      </section>
    </>
  );
}                    