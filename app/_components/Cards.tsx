import React from 'react';

interface ProjectCardProps {
  date: string;
  location: string;
  title: string;
  schedule: string;
  amount: string;
  client?: string;
  status: 'recruiting' | 'completed';
  hasMatch?: boolean;
  daysLeft?: number | null;  // ← 追加
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  date,
  location,
  title,
  schedule,
  amount,
  client,
  status,
  hasMatch,
  daysLeft,
}) => {
  // 残り日数の表示テキストと色を決める
  const daysLeftLabel =
    daysLeft === null || daysLeft === undefined
      ? null
      : daysLeft <= 0
      ? "期限切れ"
      : `${daysLeft}日`;

      const daysLeftColor =
      daysLeft !== null && daysLeft !== undefined && daysLeft > 0 && daysLeft <= 3
        ? "text-red-500"
        : "text-slate-700";

  // 期限切れ or マッチング済み or DBのステータスが完了 → バッジを「完了」にする
  const isCompleted =
    status === 'completed' ||
    hasMatch === true ||
    (daysLeft !== null && daysLeft !== undefined && daysLeft <= 0);

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
            {title}
          </h3>
          <div className="space-y-2 text-slate-700 font-medium">
            {daysLeftLabel && (
              <p className={`font-bold ${daysLeftColor}`}>・残り：{daysLeftLabel}</p>
            )}
            <p>・日程：{schedule}</p>
            <p>・金額：{amount}</p>
            {client && <p>・発注者：{client}</p>}
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

interface RequestCardProps {
  date: string;
  location: string;
  availableDates: string;
  skills: string;
  preference: string;
  company?: string;
  status: 'recruiting' | 'completed';
  hasMatch?: boolean;
  daysLeft?: number | null;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  date,
  location,
  availableDates,
  skills,
  preference,
  company,
  status,
  hasMatch,
  daysLeft,
}) => {
  const isCompleted =
    status === 'completed' ||
    hasMatch === true ||
    (daysLeft !== null && daysLeft !== undefined && daysLeft <= 0);

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
            {availableDates}
          </h3>
          <div className="space-y-2 text-slate-700 font-medium">
            <p>・調査可能内容：{skills}</p>
            <p>・希望：{preference}</p>
            {company && <p>・企業：{company}</p>}
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