'use client';

import React, { useState } from 'react';
import { Header } from './_components/Header';
import { Footer } from './_components/Footer';
import { ProjectCard, RequestCard } from './_components/Cards';

type Tab = 'projects' | 'requests';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('projects');

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-grow">
        {/* 上側：緑背景エリア */}
        <section className="hero-gradient relative overflow-hidden">

{/* 背景の水玉*/}
<div
  className="absolute top-[-140px] left-[-110px] w-[360px] md:w-[540px] aspect-square rounded-full pointer-events-none"
  style={{
    background:
      'linear-gradient(180deg, rgba(161, 214, 174, 0.38) 0%, rgba(145, 201, 160, 0.30) 100%)',
    border: '1px solid rgba(188, 229, 198, 0.24)',
    boxShadow: '0 0 0 1px rgba(150, 205, 165, 0.05) inset',
  }}
/>

<div
  className="absolute top-[6%] right-[-90px] w-[300px] md:w-[450px] aspect-square rounded-full pointer-events-none"
  style={{
    background:
      'linear-gradient(180deg, rgba(156, 210, 171, 0.34) 0%, rgba(141, 196, 157, 0.27) 100%)',
    border: '1px solid rgba(184, 226, 194, 0.22)',
    boxShadow: '0 0 0 1px rgba(145, 200, 160, 0.04) inset',
  }}
/>

<div
  className="absolute bottom-[-130px] left-[6%] w-[250px] md:w-[360px] aspect-square rounded-full pointer-events-none"
  style={{
    background:
      'linear-gradient(180deg, rgba(166, 216, 178, 0.32) 0%, rgba(148, 200, 161, 0.25) 100%)',
    border: '1px solid rgba(190, 230, 200, 0.21)',
    boxShadow: '0 0 0 1px rgba(152, 206, 167, 0.04) inset',
  }}
/>

<div
  className="absolute top-[34%] left-[28%] w-[130px] md:w-[190px] aspect-square rounded-full pointer-events-none"
  style={{
    background:
      'linear-gradient(180deg, rgba(158, 210, 172, 0.27) 0%, rgba(142, 194, 156, 0.21) 100%)',
    border: '1px solid rgba(184, 224, 193, 0.18)',
    boxShadow: '0 0 0 1px rgba(145, 198, 159, 0.03) inset',
  }}
/>

<div
  className="absolute top-[20%] left-[12%] w-[90px] md:w-[130px] aspect-square rounded-full pointer-events-none"
  style={{
    background:
      'linear-gradient(180deg, rgba(164, 214, 177, 0.24) 0%, rgba(146, 198, 160, 0.18) 100%)',
    border: '1px solid rgba(186, 225, 195, 0.16)',
    boxShadow: '0 0 0 1px rgba(146, 198, 160, 0.025) inset',
  }}
/>

<div
  className="absolute bottom-[14%] right-[14%] w-[105px] md:w-[150px] aspect-square rounded-full pointer-events-none"
  style={{
    background:
      'linear-gradient(180deg, rgba(160, 211, 173, 0.25) 0%, rgba(143, 195, 157, 0.19) 100%)',
    border: '1px solid rgba(182, 222, 191, 0.16)',
    boxShadow: '0 0 0 1px rgba(143, 196, 158, 0.025) inset',
  }}
/>

          <div className="max-w-4xl mx-auto px-4 pt-6 md:pt-10 pb-4 md:pb-6 space-y-4 md:space-y-7 relative z-10">
            {/* Hero Title */}
            <div className="text-center">
              <h2 className="text-2xl md:text-5xl font-black text-white tracking-tight text-shadow-sm leading-tight">
                {activeTab === 'projects'
                  ? '現地調査の案件マッチングサービス'
                  : '現地調査の案件マッチングサービス'}
              </h2>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center items-center gap-4 md:gap-10">
              {/* Request Survey Button */}
              <button className="flex-shrink-0 group relative bg-white rounded-full w-40 h-40 md:w-72 md:h-72 flex flex-col items-center justify-start pt-6 md:pt-10 button-shadow transition-all hover:scale-105 active:scale-95 overflow-hidden border border-white/20">
                <div className="absolute inset-0 bg-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 text-center px-4">
                  <p className="text-[10px] md:text-sm font-bold text-brand-green/100 mb-0.5 md:mb-1">
                    販売店向け
                  </p>
                  <h3 className="text-sm md:text-3xl font-black text-brand-green leading-tight mb-2 md:mb-4">
                    現調を
                    <br />
                    お願いする
                  </h3>
                </div>
                <div className="absolute bottom-0 w-full h-[45%] md:h-[50%] flex justify-center items-end pb-2 md:pb-4">
                  <img
                    src="input_file_0.png"
                    alt="販売店"
                    className="h-full w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </button>

              {/* Register Dates Button */}
              <button className="flex-shrink-0 group relative bg-white rounded-full w-40 h-40 md:w-72 md:h-72 flex flex-col items-center justify-start pt-6 md:pt-10 button-shadow transition-all hover:scale-105 active:scale-95 overflow-hidden border border-white/20">
                <div className="absolute inset-0 bg-brand-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 text-center px-4">
                  <p className="text-[10px] md:text-sm font-bold text-brand-green/100 mb-0.5 md:mb-1">
                    工事店向け
                  </p>
                  <h3 className="text-sm md:text-3xl font-black text-brand-green leading-tight mb-2 md:mb-4">
                    現調に行ける日
                    <br />
                    を登録する
                  </h3>
                </div>
                <div className="absolute bottom-0 w-full h-[45%] md:h-[50%] flex justify-center items-end pb-2 md:pb-4">
                  <img
                    src="input_file_1.png"
                    alt="工事店"
                    className="h-full w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </button>
            </div>

            {/* Search Bar */}
            <div className="space-y-3 md:space-y-6">
              <div className="relative max-w-2xl mx-auto group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-green transition-colors">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="詳細な条件で検索"
                  className="w-full bg-white rounded-xl md:rounded-2xl py-3 md:py-5 pl-10 md:pl-12 pr-4 text-sm md:text-base text-slate-600 font-bold card-shadow focus:outline-none focus:ring-4 focus:ring-white/30 transition-all border-none"
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
        <section className="cards-section">
          <div className="max-w-4xl mx-auto px-4 pt-4 md:pt-6 pb-8">
            <div className="space-y-3 md:space-y-5 max-h-[900px] overflow-y-auto pr-1 md:pr-2 hide-scrollbar">
              {activeTab === 'projects' ? (
                <>
                  <ProjectCard
                    date="2026.01.30"
                    location="東京都"
                    title="陸屋根の現地調査"
                    schedule="2026年2月1日(日)"
                    amount="15,000円"
                    client="Peg合同会社"
                    status="recruiting"
                  />
                  <ProjectCard
                    date="2026.01.30"
                    location="東京都"
                    title="屋上の現地調査"
                    schedule="2026年2月1日(日)"
                    amount="15,000円"
                    client="お試しユーザー"
                    status="completed"
                  />
                  <ProjectCard
                    date="2026.01.28"
                    location="神奈川県"
                    title="太陽光パネル設置前調査"
                    schedule="2026年2月5日(木)"
                    amount="20,000円"
                    client="エコライフ株式会社"
                    status="recruiting"
                  />
                </>
              ) : (
                <>
                  <RequestCard
                    date="2026.01.30"
                    location="東京都 北区"
                    availableDates="2026年1月31日(土)〜2月1日(日)"
                    skills="太陽光パネル・蓄電池"
                    preference="人日発注 (15,000円)"
                    company="日本合同会社"
                    status="recruiting"
                  />
                  <RequestCard
                    date="2026.01.2"
                    location="神奈川県 相模原市"
                    availableDates="2026年1月3日(土)〜1月6日(日)"
                    skills="太陽光パネル・蓄電池"
                    preference="人日発注 (15,000円)"
                    company="お試しユーザー"
                    status="completed"
                  />
                  <RequestCard
                    date="2026.01.25"
                    location="埼玉県 さいたま市"
                    availableDates="2026年2月10日(火)〜2月12日(木)"
                    skills="オール電化・エコキュート"
                    preference="案件ごと相談"
                    company="埼玉電設"
                    status="recruiting"
                  />
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}