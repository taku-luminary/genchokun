'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { ProjectCard } from '@/app/_components/Cards';
import { calcDaysLeft } from '@/app/_utils/format';
import type { ProjectDetailResponse } from '@/app/_types/projects';
import type { HomeProject } from '@/app/_types/home';
import type {
  CreateProjectApplicationRequest,
  CreateProjectApplicationResponse,
} from '@/app/_types/applications';

export default function ProjectApplyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useAuthedFetch<ProjectDetailResponse>(
    `/api/projects/${id}`,
  );

  // 下書き保存用の sessionStorage キー (案件IDごとに分けて混在を防ぐ)
  // requests版とキー名を分けることで、同時に下書きを保持できる
  const storageKey = `project-apply-message:${id}`;

  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // マウント時に sessionStorage から下書きを復元する
  // - useEffect の中身はブラウザ側でだけ実行されるので、
  //   サーバー側 (SSR) で window が無いエラーにならない
  // - 依存配列 [storageKey] は実質的にページが開かれた最初の1回だけ動く
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      setMessage(saved);
    }
  }, [storageKey]);

  // textarea の入力ハンドラ
  // - state を更新しつつ、同じ値を sessionStorage にも保存する
  // - 空文字になったら削除して、不要な下書きを残さない
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    if (value) {
      sessionStorage.setItem(storageKey, value);
    } else {
      sessionStorage.removeItem(storageKey);
    }
  };

  // 読み込み中・取得失敗
  if (isLoading) {
    return <p className="text-center text-slate-500 py-20">読み込み中...</p>;
  }
  if (error || !data) {
    return (
      <p className="text-center text-red-500 py-20">案件の取得に失敗しました</p>
    );
  }

  // 応募不可ガードを優先度順に判定する
  //   1. 自分が応募済み
  //   2. 募集が手動終了 (status=completed)
  //   3. 期限切れ (workEndDate を過ぎている)
  // どれかに該当したら案内表示 + 戻るリンクを出して、応募フォームは表示しない。
  // 注: projects は複数応募可能なので requests のような「他人マッチ済み」ガードはない。
  const daysLeft = calcDaysLeft(data.workEndDate);
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isClosed = data.status === 'completed';

  // 共通の案内表示コンポーネント (重複するJSXを関数化)
  const renderNotice = (text: string) => (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
      <p className="text-slate-600">{text}</p>
      <Link
        href={`/projects/${id}`}
        className="inline-block text-brand-green underline"
      >
        詳細ページへ戻る
      </Link>
    </div>
  );

  // すでに自分が応募済み
  if (data.hasApplied) {
    return renderNotice('すでにこの案件に応募しています');
  }

  // 募集が手動終了されている
  if (isClosed) {
    return renderNotice('この案件は募集を終了しています');
  }

  // 期限切れ
  if (isExpired) {
    return renderNotice('この案件は応募受付期間が終了しました');
  }

  // ProjectCard が要求する形式に変換 (詳細ページと同じ変換)
  const homeProject: HomeProject = {
    id: data.id,
    createdAt: data.createdAt,
    prefecture: data.prefecture,
    city: data.city,
    title: data.title,
    workStartDate: data.workStartDate,
    workEndDate: data.workEndDate,
    rewardYen: data.rewardYen,
    paymentCycle: data.paymentCycle,
    status: data.status,
    companyName: data.company?.name ?? null,
  };

  // 応募ボタン押下時
  const handleSubmit = async () => {
    if (!window.confirm('この内容で応募してよろしいですか？')) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const body: CreateProjectApplicationRequest = {
        message: message.trim() || undefined,
      };
      const res = await fetch(`/api/projects/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json: CreateProjectApplicationResponse = await res.json();

      if (!res.ok) {
        setErrorMessage(
          'error' in json ? json.error : '応募に失敗しました',
        );
        return;
      }

      // 成功時のみ下書きを削除する
      // (失敗時は残しておけば、戻って開き直したときにそのまま再応募できる)
      sessionStorage.removeItem(storageKey);

      // 成功 → 詳細ページに戻る (hasApplied=true で "応募済み" 表示になる)
      router.push(`/projects/${id}`);
    } catch {
      setErrorMessage('通信エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* 1. 案件カード (クリック無効化) */}
        <div className="pointer-events-none">
          <ProjectCard project={homeProject} />
        </div>

        {/* 2. コメント入力 */}
        <div className="bg-white rounded-2xl p-6 space-y-3 border border-slate-100">
          <label className="block text-sm font-bold text-slate-700">
            販売店へのアピールコメント (任意)
          </label>
          <textarea
            value={message}
            onChange={handleMessageChange}
            rows={5}
            maxLength={1000}
            placeholder="自社の強みや、対応可能な日程・条件などを書きましょう"
            className="w-full border border-slate-300 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-brand-green"
          />
          <p className="text-xs text-slate-400 text-right">
            {message.length} / 1000
          </p>
        </div>

        {/* 3. エラー表示 */}
        {errorMessage && (
          <p className="text-red-500 text-sm text-center">{errorMessage}</p>
        )}

        {/* 4. 応募ボタン */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-brand-green text-white font-black text-lg shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '送信中...' : 'この内容で応募する'}
        </button>

        {/* 5. 戻るリンク */}
        <Link
          href={`/projects/${id}`}
          className="w-full py-4 rounded-2xl bg-slate-300 block text-center text-slate-700  text-mm py-4"
        >
          戻る
        </Link>
      </div>
    </div>
  );
}
