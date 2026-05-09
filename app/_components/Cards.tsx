import React from 'react';
import type { HomeProject, HomeRequest } from '@/app/_types/home';
import { formatDate, formatJpDate, calcDaysLeft } from '@/app/_utils/format';

// ─── ProjectCard ───────────────────────────────────────────
interface ProjectCardProps {
  project: HomeProject;
  hasMatch?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, hasMatch }) => {
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

  const date = formatDate(project.created_at);
  const location = `${project.prefecture.name}${project.city ? ` ${project.city}` : ""}`;
  const schedule =
    project.workStartDate && project.workEndDate
      ? `${formatJpDate(project.workStartDate)}〜${formatJpDate(project.workEndDate)}`
      : "日程未定";
  const amount = project.rewardYen ? `${project.rewardYen.toLocaleString()}円` : "—";

  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-50 relative overflow-hidden transition-transform hover:scale-[1.01] cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{date}</p>
          <div className="flex items-center text-slate-700 font-bold">
            <span className="mr-1">›</span>
            <span>{location}</span>
          </div>
        </div>
        <span className={`px-4 py-1 md:px-6 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold text-white ${
          isCompleted ? 'bg-slate-500' : 'bg-brand-green'
        }`}>
          {isCompleted ? '完了' : '募集中'}
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
};

// ─── RequestCard ───────────────────────────────────────────
interface RequestCardProps {
  request: HomeRequest;
  hasMatch?: boolean;
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, hasMatch }) => {
  const daysLeft = calcDaysLeft(request.availableEndDate);

  const isCompleted =
    request.status === 'completed' ||
    hasMatch === true ||
    (daysLeft !== null && daysLeft !== undefined && daysLeft <= 0);

  const date = formatDate(request.created_at);
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

  return (
    <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-50 relative overflow-hidden transition-transform hover:scale-[1.01] cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{date}</p>
          <div className="flex items-center text-slate-700 font-bold">
            <span className="mr-1">›</span>
            <span>{location}</span>
          </div>
        </div>
        <span className={`px-4 py-1 md:px-6 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold text-white ${
          isCompleted ? 'bg-slate-500' : 'bg-brand-green'
        }`}>
          {isCompleted ? '完了' : '募集中'}
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
          <div className="flex-shrink-0 w-24 border-2 border-brand-green rounded-xl flex items-center justify-center">
            <p className="text-xs font-bold text-brand-green text-center leading-snug px-1">
              マッチング済み
            </p>
          </div>
        )}
      </div>
    </div>
  );
};