'use client';

import Link from "next/link";
import React, { useState } from 'react';
import { useAuthedFetch } from './_hooks/useAuthedFetch';
import { ProjectCard, RequestCard } from './_components/Cards';
import { HeroBackground } from './_components/HeroBackground';
import type { HomeApiResponse } from './_types/home';

const LIMIT = 20;

type Tab = 'projects' | 'requests';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [projectsPage, setProjectsPage] = useState(1);  // 案件の現在ページ
  const [requestsPage, setRequestsPage] = useState(1);  // 依頼待ちの現在ページ
  const [searchInput, setSearchInput] = useState('');   // 入力欄の表示用（打ちかけの文字）
  const [searchQuery, setSearchQuery] = useState('');   // Enterで確定した検索語（SWRキーに入る）

  // 検索確定時の処理。form の submit（Enterキー）で呼ばれる
  const handleSearch = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // form標準のページリロードを止める
    setSearchQuery(searchInput.trim());
    // 検索したら必ず1ページ目に戻す。
    // 例: 3ページ目(skip=40)のまま検索するとヒット5件でも0件表示になってしまうため
    setProjectsPage(1);
    setRequestsPage(1);
  };
  const { data, isLoading } = useAuthedFetch<HomeApiResponse>(
    `/api/home?projectsPage=${projectsPage}&requestsPage=${requestsPage}&limit=${LIMIT}&q=${encodeURIComponent(searchQuery)}`
  );

  // SWR = 指定したキーが変わったら、fetcherを実行してデータを取り直してくれる仕組み
  // useSWRは、第1引数のキーが変わると、fetcherを実行する。
  // fetcherの第1引数には、useSWRの第1引数のキーがそのまま渡される。
  // fetcherは、そのキーを使ってfetchを実行する。
  // 取得結果は data に入り、失敗したら error に入り、 取得中かどうかは isLoading に入る
  // ※今回はカスタムフックにしているのでfetcher を渡す必要がない
  
  const projects = data?.projects ?? []; // 案件の総件数
  const requests = data?.requests ?? []; // 依頼待ちの総件数
  const totalProjects = data?.totalProjects ?? 0;
  const totalRequests = data?.totalRequests ?? 0;

  return (
    <>
      {/* 上側：緑背景エリア */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4ade80] to-[#34b38a]">

        <HeroBackground />
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-6 pb-4 space-y-4 md:pt-10 md:pb-6 md:space-y-7">
          <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight text-shadow-sm leading-tight">
              電気工事の<br className="md:hidden" />案件マッチングサービス
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center items-center gap-4 md:gap-10">
            <Link href="/projects/new" className="flex-shrink-0 group relative bg-white rounded-full w-40 h-40 md:w-72 md:h-72 flex flex-col items-center justify-start pt-5 md:pt-10 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all hover:scale-105 active:scale-95 overflow-hidden border border-white/20">
              <div className="absolute inset-0 bg-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 text-center px-4">
                <h3 className="text-base md:text-3xl font-black text-brand-green leading-tight mb-2 md:mb-4">仕事を<br />発注したい</h3>
              </div>
              <div className="absolute bottom-0 w-full h-[45%] md:h-[50%] flex justify-center items-end pb-2 md:pb-4">
                <img src="input_file_0.png" alt="販売店" className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
              </div>
            </Link>

            <Link href="/requests/new" className="flex-shrink-0 group relative bg-white rounded-full w-40 h-40 md:w-72 md:h-72 flex flex-col items-center justify-start pt-5 md:pt-10 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] transition-all hover:scale-105 active:scale-95 overflow-hidden border border-white/20">
              <div className="absolute inset-0 bg-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 text-center px-4">
                <h3 className="text-base md:text-3xl font-black text-brand-green leading-tight mb-2 md:mb-4">仕事を<br />受注したい</h3>
              </div>
              <div className="absolute bottom-0 w-full h-[45%] md:h-[50%] flex justify-center items-end pb-2 md:pb-4">
                <img src="input_file_1.png" alt="工事店" className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
              </div>
            </Link>
          </div>


          {/* Search Bar */}
          <div className="space-y-3 md:space-y-6">
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-green transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="キーワードで検索（例：東京）"
                className="w-full bg-white rounded-xl md:rounded-2xl py-3.5 md:py-5 pl-10 md:pl-12 pr-4 text-base text-slate-600 font-bold shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-4 focus:ring-white/30 transition-all border-none"
              />
            </form>


            {/* Tab Switcher */}
            <div className="bg-white/80 backdrop-blur-xl p-1.5 md:p-2 rounded-2xl md:rounded-3xl flex max-w-2xl mx-auto border border-white/30 shadow-xl">
              <button
                onClick={() => setActiveTab('projects')}
                className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl text-base md:text-xl font-black transition-all duration-300 ${
                  activeTab === 'projects'
                    ? 'bg-brand-green text-white shadow-lg scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/20'
                }`}
              >
                応募できる案件
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl text-base md:text-xl font-black transition-all duration-300 ${
                  activeTab === 'requests'
                    ? 'bg-brand-green text-white shadow-lg scale-[1.02]'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/20'
                }`}
              >
                発注待ちの事業者
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
                <p className="text-center text-slate-500 py-10">工事案件はまだありません</p>
              ) : (
                // 案件カード
                projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="block">
                    <ProjectCard project={project} />
                  </Link>
                ))
              )
            )}

            {!isLoading && activeTab === 'requests' && (
              requests.length === 0 ? (
                <p className="text-center text-slate-500 py-10">対応できる工事店枠はまだありません</p>
              ) : (
                // 依頼カード
                requests.map((request) => (
                  <Link key={request.id} href={`/requests/${request.id}`} className="block">
                    <RequestCard request={request} />
                  </Link>
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