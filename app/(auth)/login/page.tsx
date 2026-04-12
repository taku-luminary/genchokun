"use client";

import { useState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
      <h1 className="text-2xl font-black text-brand-green mb-6
text-center">ログイン</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full border border-slate-200 rounded-lg px-4
py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
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
            className="w-full border border-slate-200 rounded-lg px-4
py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-green text-white font-bold py-3
rounded-xl hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        アカウントをお持ちでない方は{" "}
        <a href="/signup" className="text-brand-green font-bold
hover:underline">
          会員登録
        </a>
      </p>
    </div>
  );
}