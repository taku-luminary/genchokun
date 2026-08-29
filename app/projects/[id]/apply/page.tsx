'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useProject } from '@/app/_hooks/useProject';
import { ProjectCard } from '@/app/_components/Cards';
import { calcDaysLeft } from '@/app/_utils/format';
import type { HomeProject } from '@/app/_types/home';
import type {
  CreateProjectApplicationRequest,
  CreateProjectApplicationResponse,
} from '@/app/_types/applications';

export default function ProjectApplyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error, mutate } = useProject(id);


  // 下書き保存用の sessionStorage キー (案件IDごとに分けて混在を防ぐ)
  const storageKey = `project-apply-message:${id}`;

  // react-hook-form のフック
  // - setError でサーバ通信エラーもフォーム状態に格納する
  //   root.serverError は予約名 "root" の下位キーで、フィールドではない
  //   フォーム全体のエラーを表すのに使う (react-hook-form 公式の推奨パターン)
  // - clearErrors で root.serverError を削除し、再送信時に古いエラーを残さない
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = useForm<CreateProjectApplicationRequest>({
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
      <p className="text-center text-red-500 py-20">案件の取得に失敗しました</p>
    );
  }

  // 応募不可ガードを優先度順に判定する
  const daysLeft = calcDaysLeft(data.workEndDate);
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isClosed = data.status === 'completed';

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

  // 応募ページの再アクセスガード。
  // myMatchStatus が null 以外（pending/active/rejected）なら過去に関与があるので
  // 再応募を許可しない。状態に応じてメッセージを出し分ける。
  if (data.myMatchStatus === 'active') {
    return renderNotice('この案件はあなたがマッチング成立済みです');
  }
  if (data.myMatchStatus === 'pending') {
    return renderNotice('すでにこの案件に応募しています');
  }
  if (data.myMatchStatus === 'rejected') {
    return renderNotice('この案件は他の応募者で成立済みです');
  }
  if (isClosed) {
    return renderNotice('この案件は募集を終了しています');
  }
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
    rewardType: data.rewardType,
    rewardYen: data.rewardYen,
    paymentCycle: data.paymentCycle,
    status: data.status,
    companyName: data.company?.name ?? null,
    companyRating: data.company?.rating ?? null,
  };

  // 応募送信ハンドラ
  const onSubmit = async (values: CreateProjectApplicationRequest) => {
    if (!window.confirm('この内容で応募してよろしいですか？')) {
      return;
    }
    // 前回のサーバーエラーがあればクリアしてから送信
    clearErrors('root.serverError');

    try {
      const body: CreateProjectApplicationRequest = {
        message: values.message?.trim() || undefined,
      };
      const res = await fetch(`/api/projects/${id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json: CreateProjectApplicationResponse = await res.json();

      if (!res.ok) {
        // サーバーから返ったエラーメッセージを root.serverError として登録
        setError('root.serverError', {
          type: 'server',
          message: 'error' in json ? json.error : '応募に失敗しました',
        });
        return;
      }
      // 成功時のみ下書きを削除する
      sessionStorage.removeItem(storageKey);
      // 応募後の状態(pending)を詳細ページへ即反映させるため、キャッシュを最新化してから戻る。
      // これをしないと古いデータ(myMatchStatus: null)が残り「応募する」ボタンのまま表示される。
      // mutate() は useProject のキー専用なので引数不要。await で完了を待ってから遷移する。
      await mutate();

      // 詳細ページに戻る
      router.push(`/projects/${id}`);
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
        {/* 1. 案件カード (クリック無効化) */}
        <div className="pointer-events-none">
          <ProjectCard project={homeProject} />
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
          {isSubmitting ? '送信中...' : 'この内容で応募する'}
        </button>

        {/* 5. 戻るリンク */}
        <Link
          href={`/projects/${id}`}
          className="w-full py-4 rounded-2xl bg-slate-300 block text-center text-slate-700  text-mm py-4"
        >
          戻る
        </Link>
      </form>
    </div>
  );
}
