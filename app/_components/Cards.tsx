import React from 'react';
import type { HomeProject, HomeRequest } from '@/app/_types/home';
import type { MypageProject, MypageRequest } from '@/app/_types/mypage';
import { formatDate, formatJpDate, calcDaysLeft } from '@/app/_utils/format';

// ─── ProjectCard ───────────────────────────────────────────
interface ProjectCardProps {
  project: HomeProject | MypageProject;
  hasMatch?: boolean;
  applicationCount?: number; // マイページ用: 応募の総件数 (pending+active)
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, hasMatch, applicationCount }) => {
  const daysLeft = calcDaysLeft(project.workEndDate);

  let daysLeftLabel: string | null;
  if (daysLeft === null || daysLeft === undefined) {
    daysLeftLabel = null;
  } else if (daysLeft <= 0) {
    daysLeftLabel = "期限切れ";
  } else {
    daysLeftLabel = `${daysLeft}日`;
  }

  const daysLeftColor =
    daysLeft !== null && daysLeft !== undefined && daysLeft > 0 && daysLeft <= 3
      ? "text-red-500"
      : "text-slate-700";

  const isCompleted =
    project.status === 'completed' ||
    hasMatch === true ||
    (daysLeft !== null && daysLeft !== undefined && daysLeft <= 0);

  const date = formatDate(project.createdAt);
  const location = `${project.prefecture.name}${project.city ? ` ${project.city}` : ""}`;
  const schedule =
    project.workStartDate && project.workEndDate
      ? `${formatJpDate(project.workStartDate)}〜${formatJpDate(project.workEndDate)}`
      : "日程未定";
  const amount = project.rewardYen ? `${project.rewardYen.toLocaleString()}円` : "—";

  // 応募ありかどうか (件数が1以上)
  const hasApplications = applicationCount !== undefined && applicationCount > 0;
  // 右上ボックスを出す条件: マッチング済み or 応募あり
  const showStatusBox = hasMatch || hasApplications;
  // 右上ボックスのラベル: マッチが優先
  const statusLabel = hasMatch ? 'マッチング' : '応募あり';
  // カード枠を緑にハイライトする条件 (応募あり or マッチング済み)
  const isHighlighted = showStatusBox;

  return (
    <div className={`bg-white rounded-2xl p-6 card-shadow relative overflow-hidden transition-transform hover:scale-[1.01] cursor-pointer ${
      isHighlighted ? 'border-2 border-brand-green' : 'border border-slate-50'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{date}</p>
          <div className="flex items-center text-slate-700 font-bold">
            <span className="mr-1">›</span>
            <span>{location}</span>
          </div>
        </div>
        {/* 終了/募集中タグ: w-24 で右ボックスと幅を揃える */}
        <span className={`w-24 py-1 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold text-white text-center ${
          isCompleted ? 'bg-slate-500' : 'bg-brand-green'
        }`}>
          {isCompleted ? '終了' : '募集中'}
        </span>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <h3 className={`text-2xl font-bold mb-4 ${
            isCompleted ? 'text-slate-700' : 'text-brand-green'
          }`}>
            {project.title}
          </h3>
          <div className="space-y-2 text-slate-700 font-medium">
            {daysLeftLabel && (
              <p className={`font-bold ${daysLeftColor}`}>・残り：{daysLeftLabel}</p>
            )}
            <p>・日程：{schedule}</p>
            <p>・金額：{amount}</p>
            {project.companyName && <p>・発注者：{project.companyName}</p>}
          </div>
        </div>

        {/* 右上ボックス: 上=ラベル / 下=応募件数 */}
        {showStatusBox && (
          <div className="flex-shrink-0 w-24 border-2 border-brand-green rounded-xl flex flex-col items-center justify-center px-1 py-2">
            <p className="text-sm font-bold text-brand-green text-center leading-snug">
              {statusLabel}
            </p>
            {applicationCount !== undefined && applicationCount > 0 && (
              <p className="text-sm font-bold text-brand-green text-center mt-1">
                {applicationCount}件
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── RequestCard ───────────────────────────────────────────
interface RequestCardProps {
  request: HomeRequest | MypageRequest;
  hasMatch?: boolean;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, hasMatch }) => {
  const daysLeft = calcDaysLeft(request.availableEndDate);

  const isCompleted =
    request.status === 'completed' ||
    hasMatch === true ||
    (daysLeft !== null && daysLeft !== undefined && daysLeft <= 0);

  const date = formatDate(request.createdAt);
  const location = `${request.prefecture.name}${request.city ? ` ${request.city}` : ""}`;
  const availableDates =
    request.availableStartDate && request.availableEndDate
      ? `${formatJpDate(request.availableStartDate)}〜${formatJpDate(request.availableEndDate)}`
      : "日程未定";
  const preference =
    request.paymentCycle
      ? request.rewardMinYen
        ? `${request.paymentCycle}（${request.rewardMinYen.toLocaleString()}円）`
        : request.paymentCycle
      : "—";

  // 依頼待ちは「応募＝即マッチング」なので、ハイライト条件は hasMatch のみ
  const isHighlighted = hasMatch === true;

  return (
    <div className={`bg-white rounded-2xl p-6 card-shadow relative overflow-hidden transition-transform hover:scale-[1.01] cursor-pointer ${
      isHighlighted ? 'border-2 border-brand-green' : 'border border-slate-50'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{date}</p>
          <div className="flex items-center text-slate-700 font-bold">
            <span className="mr-1">›</span>
            <span>{location}</span>
          </div>
        </div>
        {/* 終了/募集中タグ: w-24 で右ボックスと幅を揃える */}
        <span className={`w-24 py-1 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold text-white text-center ${
          isCompleted ? 'bg-slate-500' : 'bg-brand-green'
        }`}>
          {isCompleted ? '終了' : '募集中'}
        </span>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <h3 className={`text-2xl font-bold mb-4 leading-tight ${
            isCompleted ? 'text-slate-700' : 'text-brand-green'
          }`}>
            {request.title}
          </h3>
          <div className="space-y-2 text-slate-700 font-medium">
            <p>・日程：{availableDates}</p>
            <p>・調査可能内容：{request.investigationSummary ?? "—"}</p>
            <p>・希望：{preference}</p>
            {request.companyName && <p>・企業：{request.companyName}</p>}
          </div>
        </div>

        {hasMatch && (
          <div className="flex-shrink-0 w-24 border-2 border-brand-green rounded-xl flex items-center justify-center px-1 py-2">
            <p className="text-xs font-bold text-brand-green text-center leading-snug">
              マッチング
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
