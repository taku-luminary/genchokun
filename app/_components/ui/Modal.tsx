"use client";

import ReactModal from "react-modal";

// アプリ共通のモーダル（小窓）コンポーネント。
// 見た目（オーバーレイ・パネル・タイトル・閉じるボタン）をここで統一し、
// 中身は children として利用側が差し込む。
// 新しくモーダルが必要になったら、この Modal を呼び出して中身だけ作ればよい。
//
// react-modal ライブラリが内部でやってくれること：
// ・ポータル（モーダルを document.body 直下に描画し、親要素のCSSの影響を受けない）
// ・Esc キー / オーバーレイ（背景）クリックで onRequestClose を呼ぶ
// ・フォーカストラップ（Tab キーでのフォーカス移動をモーダル内に閉じ込める）
// ・role="dialog" aria-modal="true" などアクセシビリティ属性の付与
type Props = {
  isOpen: boolean;           // モーダルを表示するかどうか（開閉状態は利用側が持つ）
  onClose: () => void;       // 閉じてほしいときに呼ばれる関数（Esc・背景タップ・×ボタン共通）
  title: string;             // モーダル上部に表示するタイトル
  children: React.ReactNode; // モーダルの中身
};

export function Modal({ isOpen, onClose, title, children }: Props) {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      // className / overlayClassName を指定すると react-modal のデフォルトスタイルは外れ、
      // ここで指定した Tailwind のクラスだけが適用される。
      // オーバーレイ: z-[60] は Header（z-50）より手前に出すため。
      //   items-end → スマホでは画面下からのシート表示 / md:items-center → PCでは中央表示
      overlayClassName="fixed inset-0 z-[60] bg-black/40 flex items-end justify-center md:items-center md:p-4"
      // パネル本体: 高さ80vhまでで中身は縦スクロール
      className="relative w-full max-h-[80vh] overflow-y-auto bg-white rounded-t-2xl p-4 outline-none md:max-w-md md:rounded-2xl"
      // モーダル表示中は body にこのクラスが付き、背景ページのスクロールが止まる
      // （自作版で useEffect + document.body.style.overflow でやっていたことと同じ）
      bodyOpenClassName="overflow-hidden"
      // ariaHideApp: モーダル表示中に「モーダル以外」を aria-hidden にする react-modal の機能。
      // 対象要素（appElement）の指定が必要だが、Next.js App Router には
      // #root のような固定のルート要素がないため false にしている
      ariaHideApp={false}
    >
      {/* ヘッダー行: タイトル + 閉じるボタン */}
      <div className="flex items-center justify-between mb-2">
        <p className="font-bold text-slate-800">{title}</p>
        {/* form 内で使われる可能性があるため type="button" 必須
            （省略すると type="submit" 扱いになりフォームが送信されてしまう） */}
        <button
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className="w-11 h-11 flex items-center justify-center text-slate-400 text-2xl"
        >
          ×
        </button>
      </div>

      {children}
    </ReactModal>
  );
}
