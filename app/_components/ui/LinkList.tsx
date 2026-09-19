import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

// 押すと別の画面へ移動する行を並べた一覧（X などの設定画面でよく見る形）。
// 使い方:
//   <LinkList>
//     <LinkListItem href="/..." title="..." description="..." icon={<SomeIcon className="h-5 w-5" />} />
//   </LinkList>

// 行をまとめる白いカード。行と行の間に区切り線を引く。
// ul / li（箇条書き）にしておくと、読み上げ機能で「リスト、2項目」のように一覧だと伝わる
export function LinkList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {children}
    </ul>
  );
}

type LinkListItemProps = {
  href: string;
  title: string;
  description?: string; // タイトルの下に出す説明（無ければ出さない）
  icon?: React.ReactNode; // 左端の丸の中に出すアイコン（無ければ出さない）
};

// 一覧の1行分。行全体を1つのリンクにして、どこを押しても移動できるようにする。
// 右端の「›」と、触れたとき・押したときの背景色の変化で、押せる行だと分かるようにする
export function LinkListItem({ href, title, description, icon }: LinkListItemProps) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-green"
      >
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-bg text-brand-green">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-slate-800">{title}</span>
          {description && (
            <span className="mt-1 block text-sm leading-relaxed text-slate-500">
              {description}
            </span>
          )}
        </span>
        {/* 触れると少し右に動き、「この先へ進める」ことを伝える */}
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}
