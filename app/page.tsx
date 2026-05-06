'use client';

import Link from "next/link";
import React, { useState } from 'react';
import useSWR from 'swr';import { ProjectCard, RequestCard } from './_components/Cards';
import { HeroBackground } from './_components/HeroBackground';
import type { HomeApiResponse, HomeProject, HomeRequest } from './_types/home';

const LIMIT = 20;

const fetcher = async (url: string): Promise<HomeApiResponse> => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("取得失敗");
  }

  return res.json();
};

type Tab = 'projects' | 'requests';

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
  // 時刻を除いた日付だけで比較するためにゼロにする
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = end.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

  export default function Home() {
    const [activeTab, setActiveTab] = useState<Tab>('projects');
    const [projectsPage, setProjectsPage] = useState(1);
    const [requestsPage, setRequestsPage] = useState(1);

    const { data, error, isLoading } = useSWR<HomeApiResponse>(
      `/api/home?projectsPage=${projectsPage}&requestsPage=${requestsPage}&limit=${LIMIT}`,
      fetcher
    );

    const projects = data?.projects ?? [];
    const requests = data?.requests ?? [];
    const totalProjects = data?.totalProjects ?? 0;
    const totalRequests = data?.totalRequests ?? 0;
  return (
    <>
      {/* 上側：緑背景エリア */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4ade80] to-[#34b38a]">

        <HeroBackground />
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-6 pb-4 space-y-4 md:pt-10 md:pb-6 md:space-y-7">
          <div className="text-center">
            <h2 className="text-2xl md:text-5xl font-black text-white tracking-tight text-shadow-sm leading-tight">
              現地調査の案件マッチングサービス
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center items-center gap-4 md:gap-10">
            <Link href="/projects/new" className="flex-shrink-0 group relative bg-white rounded-full w-40 h-40 md:w-72 md:h-72 flex flex-col items-center justify-start pt-6 md:pt-10 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all hover:scale-105 active:scale-95 overflow-hidden border border-white/20">
              <div className="absolute inset-0 bg-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 text-center px-4">
                <p className="text-[10px] md:text-sm font-bold text-brand-green/100 mb-0.5 md:mb-1">販売店向け</p>
                <h3 className="text-sm md:text-3xl font-black text-brand-green leading-tight mb-2 md:mb-4">現調を<br />お願いする</h3>
              </div>
              <div className="absolute bottom-0 w-full h-[45%] md:h-[50%] flex justify-center items-end pb-2 md:pb-4">
                <img src="input_file_0.png" alt="販売店" className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
              </div>
            </Link>

            <Link href="/requests/new" className="flex-shrink-0 group relative bg-white rounded-full w-40 h-40 md:w-72 md:h-72 flex flex-col items-center justify-start pt-6 md:pt-10 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all hover:scale-105 active:scale-95 overflow-hidden border border-white/20">
              <div className="absolute inset-0 bg-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 text-center px-4">
                <p className="text-[10px] md:text-sm font-bold text-brand-green/100 mb-0.5 md:mb-1">工事店向け</p>
                <h3 className="text-sm md:text-3xl font-black text-brand-green leading-tight mb-2 md:mb-4">現調に行ける日<br />を登録する</h3>
              </div>
              <div className="absolute bottom-0 w-full h-[45%] md:h-[50%] flex justify-center items-end pb-2 md:pb-4">
                <img src="input_file_1.png" alt="工事店" className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="space-y-3 md:space-y-6">
            <div className="relative max-w-2xl mx-auto group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-green transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <input
                type="text"
                placeholder="詳細な条件で検索"
                className="w-full bg-white rounded-xl md:rounded-2xl py-3 md:py-5 pl-10 md:pl-12 pr-4 text-sm md:text-base text-slate-600 font-bold shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-4 focus:ring-white/30 transition-all border-none"
              />
            </div>

            {/* Tab Switcher */}
            <div className="bg-white/80 backdrop-blur-xl p-1.5 md:p-2 rounded-2xl md:rounded-3xl flex max-w-2xl mx-auto border border-white/30 shadow-xl">
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-xl font-black transition-all duration-300 ${
                  activeTab === 'projects'
                    ? 'bg-brand-green text-white shadow-lg scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/20'
                }`}
              >
                募集中の工事案件
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-xl font-black transition-all duration-300 ${
                  activeTab === 'requests'
                    ? 'bg-brand-green text-white shadow-lg scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/20'
                }`}
              >
                お仕事待ちの工事店
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 下側：グレー背景エリア */}
      <section className="bg-[#e8e8e8]">
        <div className="max-w-4xl mx-auto px-4 pt-4 md:pt-6 pb-8">

          {isLoading && (
            <p className="text-center text-slate-500 py-10">読み込み中...</p>
          )}

            <div className="space-y-3 md:space-y-5">
            {!isLoading && activeTab === 'projects' && (
              projects.length === 0 ? (
                <p className="text-center text-slate-500 py-10">掲載中の案件はありません</p>
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
                    client={project.companyName ?? undefined}
                    status={project.status === "completed" ? "completed" : "recruiting"}
                    daysLeft={calcDaysLeft(project.workEndDate)}
                  />
                ))
              )
            )}

            {!isLoading && activeTab === 'requests' && (
              requests.length === 0 ? (
                <p className="text-center text-slate-500 py-10">登録中の工事店はいません</p>
              ) : (
                requests.map((request) => (
                    <RequestCard
                      key={request.id}
                      date={formatDate(request.created_at)}
                      location={`${request.prefecture.name}${request.city ? ` ${request.city}` : ""}`}
                      title={request.title}
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
                    company={request.companyName ?? undefined}
                    status={request.status === "completed" ? "completed" : "recruiting"}
                    daysLeft={calcDaysLeft(request.availableEndDate)}
                    />
                  ))
                )
              )}
            </div>
  
            {/* ページネーション：案件タブ */}
            {!isLoading && activeTab === 'projects' && totalProjects > LIMIT && (
              <div className="flex justify-center items-center gap-6 mt-6">
                <button
                  onClick={() => setProjectsPage((p) => p - 1)}
                  // 上記の意味:setProjectsPage((currentProjectsPage) => currentProjectsPage - 1)
                  // set関数に関数を渡したら、その関数の第1引数には「今のstate」が自動で入る
                  // setState((prev) => 新しい値)の形のとき、prevには、Reactが現在のstateの値を入れてくれる。
                  disabled={projectsPage <= 1}
                  className="px-5 py-2 rounded-full bg-white font-bold text-brand-green shadow disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <span className="text-sm font-bold text-slate-600">
                  {projectsPage} / {Math.ceil(totalProjects / LIMIT)}
                </span>
                
                <button
                  onClick={() => setProjectsPage((p) => p + 1)}
                  disabled={projectsPage * LIMIT >= totalProjects}
                  className="px-5 py-2 rounded-full bg-white font-bold text-brand-green shadow disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            )}
  
            {/* ページネーション：依頼待ちタブ */}
            {!isLoading && activeTab === 'requests' && totalRequests > LIMIT && (
              <div className="flex justify-center items-center gap-6 mt-6">
                <button
                  onClick={() => setRequestsPage((p) => p - 1)}
                  disabled={requestsPage <= 1}
                  className="px-5 py-2 rounded-full bg-white font-bold text-brand-green shadow disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <span className="text-sm font-bold text-slate-600">
                  {requestsPage} / {Math.ceil(totalRequests / LIMIT)}
                </span>
                <button
                  onClick={() => setRequestsPage((p) => p + 1)}
                  disabled={requestsPage * LIMIT >= totalRequests}
                  className="px-5 py-2 rounded-full bg-white font-bold text-brand-green shadow disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            )}
  
          </div>
        </section>
      </>
    );
  }