"use client";

import { useState } from "react";
import { signup } from "./actions";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signup(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <p className="text-2xl mb-2">📩</p>
        <h1 className="text-xl font-black text-brand-green mb-2">確認メールを送りました</h1>
        <p className="text-sm text-slate-500">
         送信されたメール内のリンクを<br />
         クリックして登録を完了してください。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
      <h1 className="text-2xl font-black text-brand-green mb-6 text-center">会員登録</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">
            パスワード
          </label>
          <input
            type="password"
            name="password"
            required
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">
            パスワード（確認）
          </label>
          <input
            type="password"
            name="confirmPassword"
            required
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-green text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "送信中..." : "会員登録"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        すでにアカウントをお持ちの方は{" "}
        <a href="/login" className="text-brand-green font-bold hover:underline">
          ログイン
        </a>
      </p>
    </div>
  );
}