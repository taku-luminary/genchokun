'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { RequestCard } from '@/app/_components/Cards';
import { calcDaysLeft } from '@/app/_utils/format';
import type { RequestDetailResponse } from '@/app/_types/requests';
import type { HomeRequest } from '@/app/_types/home';
import type {
  CreateRequestApplicationRequest,
  CreateRequestApplicationResponse,
} from '@/app/_types/applications';

export default function RequestApplyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useAuthedFetch<RequestDetailResponse>(
    `/api/requests/${id}`,
  );

  // 下書き保存用の sessionStorage キー (依頼IDごとに分けて混在を防ぐ)
  const storageKey = `request-apply-message:${id}`;

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
      <p className="text-center text-red-500 py-20">依頼の取得に失敗しました</p>
    );
  }

  // 応募不可ガードを優先度順に判定する (詳細ページの5分岐と揃えた整理)
  //   1. 自分がマッチング済み
  //   2. 他人がマッチング成立済み (1依頼1マッチなので応募不可)
  //   3. 募集が手動終了 (status=completed かつマッチ無し)
  //   4. 期限切れ (availableEndDate を過ぎている)
  // どれかに該当したら案内表示 + 戻るリンクを出して、応募フォームは表示しない。
  const daysLeft = calcDaysLeft(data.availableEndDate);
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isClosed = data.status === 'completed';

  // 共通の案内表示コンポーネント
  const renderNotice = (text: string) => (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
      <p className="text-slate-600">{text}</p>
      <Link
        href={`/requests/${id}`}
        className="inline-block text-brand-green underline"
      >
        詳細ページへ戻る
      </Link>
    </div>
  );

  // すでに自分がマッチング済み
  if (data.hasApplied) {
    return renderNotice('すでにマッチング済みです');
  }

  // 他のユーザーとマッチング成立済み (1依頼1マッチのため応募不可)
  if (data.isMatched) {
    return renderNotice('他のユーザーとマッチングが成立済みです');
  }

  // 募集が手動終了されている
  if (isClosed) {
    return renderNotice('この依頼は募集を終了しています');
  }

  // 期限切れ
  if (isExpired) {
    return renderNotice('この依頼は応募受付期間が終了しました');
  }

  // RequestCard が要求する形式に変換 (詳細ページと同じ変換)
  const homeRequest: HomeRequest = {
    id: data.id,
    createdAt: data.createdAt,
    prefecture: data.prefecture,
    city: data.city,
    title: data.title,
    availableStartDate: data.availableStartDate,
    availableEndDate: data.availableEndDate,
    investigationSummary: data.investigationSummary,
    paymentCycle: data.paymentCycle,
    rewardMinYen: data.rewardMinYen,
    status: data.status,
    companyName: data.company?.name ?? null,
  };

  // 応募ボタン押下時
  const handleSubmit = async () => {
    if (
      !window.confirm(
        'この内容で応募しますか？\n応募と同時にマッチングが成立し、キャンセルできません。',
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const body: CreateRequestApplicationRequest = {
        message: message.trim() || undefined,
      };
      const res = await fetch(`/api/requests/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json: CreateRequestApplicationResponse = await res.json();

      if (!res.ok) {
        setErrorMessage(
          'error' in json ? json.error : '応募に失敗しました',
        );
        return;
      }

      // 成功時のみ下書きを削除する
      // (失敗時は残しておけば、戻って開き直したときにそのまま再応募できる)
      sessionStorage.removeItem(storageKey);

      // 成功 → 詳細ページに戻る (hasApplied=true で "マッチング済み" 表示になる)
      router.push(`/requests/${id}`);
    } catch {
      setErrorMessage('通信エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* 1. 依頼カード (クリック無効化) */}
        <div className="pointer-events-none">
          <RequestCard request={homeRequest} />
        </div>

        {/* 2. コメント入力 */}
        <div className="bg-white rounded-2xl p-6 space-y-3 border border-slate-100">
          <label className="block text-sm font-bold text-slate-700">
            相手へのコメント (任意)
          </label>
          <textarea
            value={message}
            onChange={handleMessageChange}
            rows={5}
            maxLength={1000}
            placeholder="自己紹介や、現地調査をお願いしたい背景などを書きましょう"
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
          {isSubmitting ? '送信中...' : 'この内容で応募する (即マッチング)'}
        </button>

        {/* 5. 戻るリンク */}
        <Link
          href={`/requests/${id}`}
          className="w-full py-4 rounded-2xl bg-slate-300 block text-center text-slate-700  text-mm py-4"
        >
          戻る
        </Link>
      </div>
    </div>
  );
}                
