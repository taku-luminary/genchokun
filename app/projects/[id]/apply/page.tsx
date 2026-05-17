'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
  const storageKey = `project-apply-message:${id}`;

  // サーバ通信エラーは useState で保持 (requests/new など他フォームと同じパターン)
  const [serverError, setServerError] = useState<string | null>(null);

  // react-hook-form のフック (他フォームと同じパターン)
  // - フォーム値の管理、送信中フラグ (isSubmitting) を一括で扱う
  // - defaultValues で初期値を空文字に
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<CreateProjectApplicationRequest>({
    defaultValues: { message: '' },
  });

  // 文字数カウンタ用に message の現在値を取得
  // watch は値変化で再レンダリングを起こすが、textarea 1個なので影響は小さい
  const message = watch('message') ?? '';

  // ======setValue:の説明======
  // ・register: 入力欄と RHF をつなぐコード。 ユーザーが入力したら、その値が RHF 内部に保存されるようにする関数
  // ・setValue: ユーザーが入力していなくても、RHF 内部に保存されている入力値を、コード側から変更するための関数
  // 
  // setValue("message", saved) と書くと、message 欄の値を saved に変更できる。
  // 今回は sessionStorage に保存されていた下書きを textarea に復元するために使っている。

  // ======sessionStorage に保存されていた下書きを textarea に復元する処理======
  // ここでは、以前入力途中だったコメントが sessionStorage に残っていれば、それを React Hook Form の message 欄に戻している。
  // まず、sessionStorage.getItem(storageKey) で、ブラウザに保存されていた下書きコメントを取り出す。
  // 例：
  // storageKey = "project-apply-message:123"
  // sessionStorage に "あとで応募します" が保存されていた場合、
  // saved には "あとで応募します" が入る。
  //
  // ただし、sessionStorage から値を取り出しただけでは、textarea には自動で表示されない。
  // なぜなら、今回のtextarea は useState ではなく、React Hook Form が register("message") によって管理しているから。
  // そのため、React Hook Form が管理している message の値をコード側から変更するために setValue を使う。
  //
  // setValue("message", saved) は、イメージとしては、formValues["message"] = saved;
  // つまり、React Hook Form 内部に保存されているmessage の値を saved に更新している。
  //
  // さらに、React Hook Form は register の ref によって実際の textarea 要素も覚えているため、
  // 内部データだけでなく、画面上の textarea にも saved の内容が反映される。
  
  // ======= 役割の違い =======
  // ・register 本来の onChange：ユーザーが入力した内容を RHF 内部に保存する担当。
  //
  // ・register に追加した onChange：入力中の内容を sessionStorage に保存する担当。
  //   sessionStorage.setItem(...) は「下書きを保存する処理」。
  //
  // ・useEffect + setValue 側：sessionStorage の内容を textarea に復元する担当。
  //   setValue(...) は「保存されていた下書きをフォームに戻す処理」。
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      setValue('message', saved);
    }
  }, [storageKey, setValue]);
  // ====== setValue 後の反映先①：textarea ======
  // setValue("message", saved) によって RHF 内部の message が更新される。
  // textarea は register("message") によって RHF の message と接続されているため、
  // RHF 内部の message が更新されると、画面上の textarea にも saved の内容が表示される。
  
  // ====== setValue 後の反映先②：watch ======
  // watch("message") は RHF 内部の message の現在値を監視している。
  // setValue("message", saved) によって RHF 内部の message が更新されると、
  // watch("message") もその新しい値を取得する。
  // その結果、const message = watch("message") ?? "" の message も更新され、
  // {message.length} / 1000 の文字数カウンターにも反映される。

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
  // projects は複数応募可能なので requests のような「他人マッチ済み」ガードはない。
  const daysLeft = calcDaysLeft(data.workEndDate);
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isClosed = data.status === 'completed';

  // 共通の案内表示 (重複するJSXを関数化)
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

  if (data.hasApplied) {
    return renderNotice('すでにこの案件に応募しています');
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
    rewardYen: data.rewardYen,
    paymentCycle: data.paymentCycle,
    status: data.status,
    companyName: data.company?.name ?? null,
  };

  // 応募送信ハンドラ
  // - handleSubmit(onSubmit) でラップされ、values にフォームの中身が渡る
  // - 確認ダイアログで Cancel なら何もしない (isSubmitting は自動的に false に戻る)
  const onSubmit = async (values: CreateProjectApplicationRequest) => {
    if (!window.confirm('この内容で応募してよろしいですか？')) {
      return;
    }
    setServerError(null);

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
        setServerError('error' in json ? json.error : '応募に失敗しました');
        return;
      }

      // 成功時のみ下書きを削除する
      sessionStorage.removeItem(storageKey);

      // 詳細ページに戻る (hasApplied=true で「応募済み」表示になる)
      router.push(`/projects/${id}`);
    } catch {
      setServerError('通信エラーが発生しました');
    }
  };

  return (
    <div className="bg-[#e8e8e8] min-h-screen">
      {/* <form> でラップして handleSubmit を onSubmit に渡す
          (button type="submit" でフォーム送信が発火する) */}
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
            販売店へのアピールコメント (任意)
          </label>
          <textarea
            rows={5}
            maxLength={1000}
            disabled={isSubmitting}
            placeholder="自社の強みや、対応可能な日程・条件などを書きましょう"
            className="w-full border border-slate-300 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-brand-green"
            // register が onChange/onBlur/ref などフォーム連動に必要な props を一括で渡す。
            // 自前で onChange の追加処理 (sessionStorage連動) も渡したいときは
            // register の第2引数オプションに { onChange } を渡せばよい。
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

        {/* 3. エラー表示 */}
        {serverError && (
          <p className="text-red-500 text-sm text-center">{serverError}</p>
        )}

        {/* 4. 応募ボタン (type="submit" でフォーム送信) */}
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
