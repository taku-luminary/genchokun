import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

// 押せる行を並べた一覧（X などの設定画面でよく見る形）。
// 別の画面へ進む行は LinkListItem、その場で操作を実行する行（ログアウトなど）は ButtonListItem を使う。
// 使い方:
//   <LinkList>
//     <LinkListItem href="/..." title="..." description="..." icon={<SomeIcon className="h-5 w-5" />} />
//     <ButtonListItem title="..." icon={<SomeIcon className="h-5 w-5" />} onClick={...} />
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

// 行全体の見た目（リンクの行とボタンの行で共通）。
// 行全体を押せるようにし、触れたとき・押したときに背景色を変えて、押せる行だと分かるようにする
const rowClassName =
  "group flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50 active:bg-slate-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-green disabled:opacity-50";

type RowContentProps = {
  title: string;
  description?: string; // タイトルの下に出す説明（無ければ出さない）
  icon?: React.ReactNode; // 左端の丸の中に出すアイコン（無ければ出さない）
  muted?: boolean; // true のときはアイコンをグレーにする（ログアウトのように、目立たせたくない行に使う）
};

// 行の中身（左のアイコン・タイトル・説明）。リンクの行とボタンの行で共通
function RowContent({ title, description, icon, muted = false }: RowContentProps) {
  return (
    <>
      {icon && (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            muted ? "bg-slate-100 text-slate-500" : "bg-brand-bg text-brand-green"
          }`}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-slate-800">{title}</span>
        {description && (
          <span className="mt-1 block text-sm leading-relaxed text-slate-500">{description}</span>
        )}
      </span>
    </>
  );
}

type LinkListItemProps = {
  href: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

// 別の画面へ進む行。右端の「›」で「この先に画面がある」ことを示す
export function LinkListItem({ href, title, description, icon }: LinkListItemProps) {
  return (
    <li>
      <Link href={href} className={rowClassName}>
        <RowContent title={title} description={description} icon={icon} />
        {/* 触れると少し右に動き、「この先へ進める」ことを伝える */}
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

type ButtonListItemProps = {
  title: string;
  onClick: () => void;
  description?: string;
  icon?: React.ReactNode;
  muted?: boolean;
  disabled?: boolean; // 処理中など、押せないようにしたいときに true
};

// その場で操作を実行する行（ログアウトなど）。
// 別の画面へ進むわけではないので、右端の「›」は付けない
export function ButtonListItem({ title, onClick, description, icon, muted, disabled }: ButtonListItemProps) {
  return (
    <li>
      <button type="button" onClick={onClick} disabled={disabled} className={rowClassName}>
        <RowContent title={title} description={description} icon={icon} muted={muted} />
      </button>
    </li>
  );
}
