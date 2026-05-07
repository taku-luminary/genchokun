"use client";

import { useState } from "react";
import { ProjectCard, RequestCard } from "@/app/_components/Cards";
import type { MypageApiResponse} from "@/app/_types/mypage";
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';


// "2026.01.29" 形式に変換
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// "1月31日(土)" 形式に変換
function formatJpDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}月${d.getDate()}日(${days[d.getDay()]})`;
}

// 作業終了日から残り日数を計算する（nullなら null を返す）
function calcDaysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const end = new Date(dateStr);
  const today = new Date();
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = end.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}


export default function MyPage() {
  const { data, error, isLoading } = useAuthedFetch<MypageApiResponse>("/api/mypage");
  const [tab, setTab] = useState<"projects" | "requests">("projects");
  const stats = data?.stats;
  const projects = data?.projects ?? [];
  const requests = data?.requests ?? [];

  return (
    <>
      {/* ========== 上部：白背景エリア ========== */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-6 space-y-6">

          <h1 className="text-2xl md:text-3xl font-black text-center text-slate-800">
            マイページ
          </h1>

          {/* 統計グリッド（3マス） */}
          {isLoading && (
            <p className="text-center text-slate-500">
              データを読み込み中...
            </p>
          )}

          {!isLoading && error && (
            <p className="text-center text-red-500">
              データを取得できませんでした
            </p>
          )}

          {!isLoading && !error && stats && (
            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">

              <div
                className={`rounded-2xl p-4 md:p-6 row-span-2 flex flex-col justify-between border-2 card-shadow 
                  ${stats.todoCount > 0
                    ? "bg-red-50 border-red-100"
                    : "bg-white border-slate-300"
                }`}
              >
                <div>
                  <p className="font-black text-slate-700">やること</p>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">
                    マッチング・応募されている案件
                  </p>
                </div>
                <p
                  className={`text-5xl md:text-6xl font-black mt-4 ${
                    stats.todoCount > 0 ? "text-red-400" : "text-slate-800"
                  }`}
                >
                  {stats.todoCount}
                  <span className="text-2xl ml-1">件</span>
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border-2 border-slate-300 card-shadow">
                <p className="text-sm md:text-base text-slate-600">
                  あなたが<strong>掲載</strong>した案件
                </p>
                <p className="text-3xl md:text-4xl font-black text-slate-800 mt-2">
                  {stats.projectCount}
                  <span className="text-xl ml-1">件</span>
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-5 border-2 border-slate-300 card-shadow">
                <p className="text-sm md:text-base text-slate-600">
                  あなたが<strong>応募</strong>した案件
                </p>
                <p className="text-3xl md:text-4xl font-black text-slate-800 mt-2">
                  {stats.applicationCount}
                  <span className="text-xl ml-1">件</span>
                </p>
              </div>
            </div>
          )}

          <p className="text-center text-slate-600 font-bold">
            ーーあなたが掲載した案件ーー
          </p>

          <div className="bg-slate-100 p-1.5 md:p-2 rounded-2xl md:rounded-3xl flex max-w-2xl mx-auto shadow-inner">
            <button
              onClick={() => setTab("projects")}
              className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-xl font-black transition-all duration-300 ${
                tab === "projects"
                  ? "bg-brand-green text-white shadow-lg scale-[1.02]"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/100"
              }`}
            >
              募集中の工事案件
            </button>
            <button
              onClick={() => setTab("requests")}
              className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-xl font-black transition-all duration-300 ${
                tab === "requests"
                  ? "bg-brand-green text-white shadow-lg scale-[1.02]"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/100"
              }`}
            >
              お仕事待ちの工事店
            </button>
          </div>
        </div>
      </section>

      {/* ========== 下部：グレー背景エリア ========== */}
      <section className="bg-[#e8e8e8]">
        <div className="max-w-4xl mx-auto px-4 pt-4 md:pt-6 pb-8">

          {isLoading && (
              <p className="text-center text-slate-500 py-10">読み込み中...</p>
            )}
           {!isLoading && error && (
              <p className="text-center text-red-500 py-10">
                データの取得に失敗しました
              </p>
            )}

          {!isLoading && !error && tab === "projects" && (
            <div className="space-y-3 md:space-y-5">
              {projects.length === 0 ? (
                <p className="text-center text-slate-500 py-10">
                  掲載した案件はありません
                </p>
              ) : (
                projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  date={formatDate(project.created_at)}
                  location={`${project.prefecture.name}${project.city ? ` ${project.city}` : ""}`}
                  title={project.title}
                  schedule={
                    project.workStartDate && project.workEndDate
                      ? `${formatJpDate(project.workStartDate)}〜${formatJpDate(project.workEndDate)}`
                      : "日程未定"
                  }
                  amount={project.rewardYen ? `${project.rewardYen.toLocaleString()}円` : "—"}
                  status={project.status === "completed" ? "completed" : "recruiting"}
                  hasMatch={project.matches.some((m) => m.status === "active")}
                  daysLeft={calcDaysLeft(project.workEndDate)}
                />
                ))
              )}
            </div>
          )}

          {!isLoading && !error && tab === "requests" && (
            <div className="space-y-3 md:space-y-5">
              {requests.length === 0 ? (
                <p className="text-center text-slate-500 py-10">
                  掲載した依頼待ちはありません
                </p>
              ) : (
                requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    title={request.title ?? "（タイトルなし）"} 
                    date={formatDate(request.created_at)}
                    location={`${request.prefecture.name}${request.city ? ` ${request.city}` : ""}`}
                    availableDates={
                      request.availableStartDate && request.availableEndDate
                        ? `${formatJpDate(request.availableStartDate)}〜${formatJpDate(request.availableEndDate)}`
                        : "日程未定"
                    }
                    skills={request.investigationSummary ?? "—"}
                    preference={
                      request.paymentCycle
                        ? request.rewardMinYen
                          ? `${request.paymentCycle}（${request.rewardMinYen.toLocaleString()}円）`
                          : request.paymentCycle
                        : "—"
                    }
                    status={request.status === "completed" ? "completed" : "recruiting"}
                    hasMatch={request.match?.status === "active"}
                  />
                ))
              )}
            </div>
          )}

        </div>
      </section>
    </>
  );
}