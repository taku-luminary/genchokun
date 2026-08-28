'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useAuthedFetch } from '@/app/_hooks/useAuthedFetch';
import { mutate } from 'swr';
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

  // 下書き保存用の sessionStorage キー
  const storageKey = `request-apply-message:${id}`;

  // react-hook-form のフック
  // - setError でサーバ通信エラーもフォーム状態に格納する
  //   root.serverError は予約名 "root" の下位キーで、フィールドではない
  //   フォーム全体のエラーを表すのに使う (react-hook-form 公式の推奨パターン)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = useForm<CreateRequestApplicationRequest>({
    defaultValues: { message: '' },
  });

  // 文字数カウンタ用に message の現在値を取得
  const message = watch('message') ?? '';

  // マウント時に sessionStorage から下書きを復元する
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      setValue('message', saved);
    }
  }, [storageKey, setValue]);

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
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isClosed = data.status === 'completed';

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

  if (data.hasApplied) {
    return renderNotice('すでにマッチング済みです');
  }
  if (data.isMatched) {
    return renderNotice('他のユーザーとマッチングが成立済みです');
  }
  if (isClosed) {
    return renderNotice('この依頼は募集を終了しています');
  }
  if (isExpired) {
    return renderNotice('この依頼は応募受付期間が終了しました');
  }

  // RequestCard が要求する形式に変換
  const homeRequest: HomeRequest = {
    id: data.id,
    createdAt: data.createdAt,
    prefectures: data.prefectures,
    city: data.city,
    title: data.title,
    availableStartDate: data.availableStartDate,
    availableEndDate: data.availableEndDate,
    summary: data.summary,
    paymentCycle: data.paymentCycle,
    rewardType: data.rewardType,
    rewardMinYen: data.rewardMinYen,
    status: data.status,
    companyName: data.company?.name ?? null,
    companyRating: data.company?.rating ?? null,
  };

  // 応募送信ハンドラ
  const onSubmit = async (values: CreateRequestApplicationRequest) => {
    if (
      !window.confirm(
        'この内容で応募しますか？\n応募と同時にマッチングが成立し、キャンセルできません。',
      )
    ) {
      return;
    }
    // 前回のサーバーエラーがあればクリアしてから送信
    clearErrors('root.serverError');

    try {
      const body: CreateRequestApplicationRequest = {
        message: values.message?.trim() || undefined,
      };
      const res = await fetch(`/api/requests/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json: CreateRequestApplicationResponse = await res.json();

      if (!res.ok) {
        setError('root.serverError', {
          type: 'server',
          message: 'error' in json ? json.error : '応募に失敗しました',
        });
        return;
      }

      // 成功時のみ下書きを削除する
      sessionStorage.removeItem(storageKey);

      // 詳細ページと同じキャッシュ(/api/requests/${id})を取り直してから戻る。
      // これをしないと応募前の古いデータが残り、詳細で「応募する」のまま表示される。
      await mutate(`/api/requests/${id}`);
      router.push(`/requests/${id}`);
    } catch {
      setError('root.serverError', {
        type: 'network',
        message: '通信エラーが発生しました',
      });
    }
  };

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-4xl mx-auto px-4 py-6 space-y-4"
      >
        {/* 1. 依頼カード (クリック無効化) */}
        <div className="pointer-events-none">
          <RequestCard request={homeRequest} />
        </div>

        {/* 2. コメント入力 */}
        <div className="bg-white rounded-2xl p-6 space-y-3 border border-slate-100">
          <label className="block text-sm font-bold text-slate-700">
            掲載元企業へのメッセージ (任意)
          </label>
          <textarea
            rows={5}
            maxLength={1000}
            disabled={isSubmitting}
            placeholder="自己紹介・自社の強みや、具体的な条件・相談事項など相手へ伝えたいことを書きましょう"
            className="w-full border border-slate-300 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-brand-green"
            {...register('message', {
              onChange: (e) => {
                const value = e.target.value;
                if (value) {
                  sessionStorage.setItem(storageKey, value);
                } else {
                  sessionStorage.removeItem(storageKey);
                }
              },
            })}
          />
          <p className="text-xs text-slate-400 text-right">
            {message.length} / 1000
          </p>
        </div>

        {/* 3. サーバーエラー表示 (root.serverError から参照) */}
        {errors.root?.serverError?.message && (
          <p className="text-red-500 text-sm text-center">
            {errors.root.serverError.message}
          </p>
        )}

        {/* 4. 応募ボタン */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-brand-green text-white font-black text-lg shadow hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '送信中...' : 'この内容でお願いする (即マッチングします)'}
        </button>

        {/* 5. 戻るリンク */}
        <Link
          href={`/requests/${id}`}
          className="w-full py-4 rounded-2xl bg-slate-300 block text-center text-slate-700  text-mm py-4"
        >
          戻る
        </Link>
      </form>
    </div>
  );
}
