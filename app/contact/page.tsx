import type { Metadata } from "next";
import { CardHeader } from "@/app/_components/ui/CardHeader";
import { OPERATOR } from "@/app/_constants/legal/operator";

export const metadata: Metadata = {
  title: "お問い合わせ・報告 | 電工くん",
  description: "電工くんの運営者情報と、お問い合わせ窓口のご案内です。",
};

// 退会や個人情報に関する請求は退会後にも行われるため、このページは
// 未ログインでも読めるように proxy.ts の PUBLIC_PATHS に登録している。
export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-xl font-bold text-slate-800 md:text-2xl">お問い合わせ・報告</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
        ご連絡はLINEで承っています。退会のお申し出やご登録情報の修正も、こちらの窓口からご連絡ください。
      </p>

      <div className="mt-8">
        {/* ui/Button は <button> を返すため外部リンクには使えない。
            ここだけなので同じ見た目のクラスを <a> に当てている */}
        <a
          href={OPERATOR.lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-xl bg-brand-green py-3 text-center font-bold text-white transition hover:opacity-90"
        >
          LINEで問い合わせる
        </a>

        <a
          href={`mailto:${OPERATOR.email}`}
          className="mt-2 block py-3 text-center text-sm text-slate-500 underline"
        >
          LINEをお使いでない方はこちら（メール）
        </a>
      </div>

      {/* フッターの「運営会社」からアンカーで飛んでくる */}
      <section id="operator" className="mt-10">
        <CardHeader title="運営者情報" />
        <dl className="mt-3 space-y-4 text-sm md:text-base">
          <div>
            <dt className="text-xs text-slate-400">商号</dt>
            <dd className="mt-0.5 text-slate-700">{OPERATOR.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">所在地</dt>
            <dd className="mt-0.5 text-slate-700">
              〒{OPERATOR.postalCode}
              <br />
              {OPERATOR.address}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">メールアドレス</dt>
            <dd className="mt-0.5 break-all text-slate-700">{OPERATOR.email}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
