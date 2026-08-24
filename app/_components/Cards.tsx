import React from 'react';
import type { HomeProject, HomeRequest } from '@/app/_types/home';
import type { MypageProject, MypageRequest } from '@/app/_types/mypage';
import { formatDate, formatJpDate, calcDaysLeft } from '@/app/_utils/format';
import { StarRating } from '@/app/_components/ui/StarRating';


// ─── ProjectCard ───────────────────────────────────────────
interface ProjectCardProps {
  project: HomeProject | MypageProject;
  isMatched?: boolean;
  applicationCount?: number; // マイページ用: 応募の総件数 (pending+active)
  attention?: boolean; // 要対応（赤背景）。isMatched より優先
}


export const ProjectCard: React.FC<ProjectCardProps> = ({ project, isMatched, applicationCount, attention }) => {
  const daysLeft = calcDaysLeft(project.workEndDate);

  let daysLeftLabel: string | null;
  if (daysLeft === null || daysLeft === undefined) {
    daysLeftLabel = null;
  } else if (daysLeft < 0) {
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
    isMatched === true ||  
    (daysLeft !== null && daysLeft !== undefined && daysLeft < 0);

    const date = formatDate(project.createdAt);
    const location = `${project.prefecture.name}${project.city ? ` ${project.city}` : ""}`;
    const schedule =
      project.workStartDate && project.workEndDate
      ? `${formatJpDate(project.workStartDate)}〜${formatJpDate(project.workEndDate)}`
      : "日程未定";
  // 見積もり希望なら金額の代わりに文言を出す。金額指定なら「◯◯円」、未設定は「—」。
  const amount =
    project.rewardType === "negotiable"
      ? "見積もり希望"
      : project.rewardYen
        ? `${project.rewardYen.toLocaleString()}円`
        : "—";

  // 応募ありかどうか (件数が1以上)
  const hasApplications = applicationCount !== undefined && applicationCount > 0;
  // 右上タグを出す条件: マッチング済み or 応募あり
  const showStatusBox = isMatched || hasApplications;
  // 右上タグのラベル: マッチが優先。応募中は件数付きで表示する
  const statusLabel = isMatched ? 'マッチング' : `応募${applicationCount}件`;
  // テーマ: マッチ成立=緑 / 応募ありのみ=赤（「やること」と同じ“要対応”の意味で赤）
  const isPending = !isMatched && hasApplications;

  return (
    <div className={`rounded-2xl p-4 md:p-6 card-shadow relative overflow-hidden transition-transform hover:scale-[1.01] cursor-pointer ${
      attention ? 'bg-red-50 border-2 border-red-50'
      : isMatched ? 'bg-brand-bg border-2 border-brand-green'
      : isPending ? 'bg-red-50 border-2 border-red-50'
      : 'bg-white border border-slate-50'
    }`}>


      <div className="flex justify-between items-start mb-2 md:mb-4">
        <div className="space-y-1">
          <p className="text-xs md:text-sm font-medium text-slate-400">{date}</p>
          <div className="flex items-center text-sm md:text-base text-slate-700 font-bold">
            <span className="mr-1">›</span>
            <span>{location}</span>
          </div>
        </div>

        {/* 右上: ステータスタグ（応募/マッチング）と終了/募集中タグを横並びにする。
            タイトルと日程がカード全幅を使えるよう、ボックスをタイトル横から上段へ移動した */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
        {showStatusBox && (
            <span className={`w-20 md:w-24 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold text-center whitespace-nowrap border-2 bg-white ${
              isMatched ? 'border-brand-green text-brand-green' : 'border-red-400 text-red-400'
            }`}>
              {statusLabel}
            </span>
          )}

          {/* 終了/募集中タグ: 隣のステータスタグ(border-2)と高さを揃えるため背景と同色の枠を付ける */}
          <span className={`w-20 md:w-24 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold text-white text-center border-2 ${
            isCompleted ? 'bg-slate-500 border-slate-500' : 'bg-brand-green border-brand-green'
          }`}>

            {isCompleted ? '終了' : '募集中'}
          </span>
        </div>
      </div>

      <div>
        <h3 className={`text-lg md:text-2xl font-bold mb-1 md:mb-4 ${
          isCompleted ? 'text-slate-700' : 'text-brand-green'
        }`}>
          {project.title}
        </h3>
        <div className="space-y-1 md:space-y-2 text-sm md:text-base text-slate-700 font-medium">
          {daysLeftLabel && (
            <p className={`font-bold ${daysLeftColor}`}>・残り：{daysLeftLabel}</p>
          )}
          <p>・日程：{schedule}</p>
          <p>・金額：{amount}</p>
          {project.companyName && (
            <p className="flex flex-wrap items-center gap-x-2">
              <span>・発注者：{project.companyName}</span>
              {project.companyRating ? (
                <StarRating
                  rating={project.companyRating.average}
                  count={project.companyRating.count}
                />
              ) : (
                <span className="text-xs text-slate-400">（0件）</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );

};

// ─── RequestCard ───────────────────────────────────────────
interface RequestCardProps {
  request: HomeRequest | MypageRequest;
  isMatched?: boolean;
  attention?: boolean; // 要対応（赤背景）。isMatched より優先
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, isMatched, attention }) => {

  const daysLeft = calcDaysLeft(request.availableEndDate);

  const isCompleted =
    request.status === 'completed' ||
    isMatched === true ||
    (daysLeft !== null && daysLeft !== undefined && daysLeft < 0);

  const date = formatDate(request.createdAt);
  const prefNames = request.prefectures.map((p) => p.name).join("・");
  const location = `${prefNames}${request.city ? ` ${request.city}` : ""}`;
  const availableDates =
    request.availableStartDate && request.availableEndDate
      ? `${formatJpDate(request.availableStartDate)}〜${formatJpDate(request.availableEndDate)}`
      : "日程未定";
      const preference =
      request.rewardType === "negotiable"
        ? "見積もり希望"
        : request.paymentCycle
          ? request.rewardMinYen
            ? `${request.rewardMinYen.toLocaleString()}円 (${request.paymentCycle})`
            : request.paymentCycle
          : "—";
  
      
      return (
        // 依頼待ちは「応募＝即マッチング」なので、ハイライト条件は isMatched のみ
        //（ProjectCard と違い「応募あり」状態が無いため）
        <div className={`rounded-2xl p-4 md:p-6 card-shadow relative overflow-hidden transition-transform hover:scale-[1.01] cursor-pointer ${
          attention ? 'bg-red-50 border-2 border-red-50'
          : isMatched ? 'bg-brand-bg border-2 border-brand-green'
          : 'bg-white border border-slate-50'
        }`}>

          <div className="flex justify-between items-start mb-2 md:mb-4">
            <div className="space-y-1">
              <p className="text-xs md:text-sm font-medium text-slate-400">{date}</p>
              <div className="flex items-center text-sm md:text-base text-slate-700 font-bold">
                <span className="mr-1">›</span>
                <span>{location}</span>
              </div>
            </div>
    
            {/* 右上: マッチングタグと終了/募集中タグを横並びにする（ProjectCard と同じ構成） */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {isMatched && (
                <span className="w-20 md:w-24 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold text-center whitespace-nowrap border-2 bg-white border-brand-green text-brand-green">
                  マッチング
                </span>
              )}

          {/* 終了/募集中タグ: 隣のステータスタグ(border-2)と高さを揃えるため背景と同色の枠を付ける */}
          <span className={`w-20 md:w-24 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold text-white text-center border-2 ${
            isCompleted ? 'bg-slate-500 border-slate-500' : 'bg-brand-green border-brand-green'
          }`}>

                {isCompleted ? '終了' : '募集中'}
              </span>
            </div>
          </div>
    
          <div>
            <h3 className={`text-lg md:text-2xl font-bold mb-1 md:mb-4 leading-tight ${
              isCompleted ? 'text-slate-700' : 'text-brand-green'
            }`}>
              {request.title}
            </h3>
            <div className="space-y-1 md:space-y-2 text-sm md:text-base text-slate-700 font-medium">
              <p>・日程：{availableDates}</p>
              <p>・依頼できる内容：{request.summary ?? "—"}</p>
              <p>・金額（支払サイクル）：{preference}</p>
              {request.companyName && (
                <p className="flex flex-wrap items-center gap-x-2">
                  <span>・企業：{request.companyName}</span>
                  {request.companyRating ? (
                    <StarRating
                      rating={request.companyRating.average}
                      count={request.companyRating.count}
                    />
                  ) : (
                    <span className="text-xs text-slate-400">（0件）</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    
};
