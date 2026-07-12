"use client";

import { useState } from "react";
import { Modal } from "@/app/_components/ui/Modal";
import { PREFECTURES, PREFECTURE_AREAS } from "@/app/_constants/prefectures";

// このコンポーネントは「開閉トリガーのボタン」と「モーダルの中身（都道府県ボタン一覧）」を担当する。
// モーダルの枠（オーバーレイ・タイトル・×ボタン・Escで閉じる・背景スクロール固定・フォーカストラップ）は
// 汎用コンポーネント Modal（react-modal 製）に任せている。
// フォームの値そのものは持たず、親（react-hook-form）から value / onChange を受け取る。
// こういう部品を「制御されたコンポーネント (controlled component)」と呼ぶ。
type Props = {
  value: number | null;                     // 選択中の prefectureId（未選択は null）
  onChange: (prefectureId: number) => void; // 選択されたときに親へ番号を渡す
  disabled?: boolean;                       // 送信中はタップできないようにする
  id?: string;                              // Label の htmlFor と紐づける用
};

// ※ 以下の学習メモは、旧実装（このファイル内で useEffect を使って背景スクロール固定」と「Escキーで閉じる」を自作していた頃）のもの。
//    現在この2つの処理は Modal（react-modal）が内部で行っているため対応するコードは無いが、
//    useEffect とクリーンアップの理解用メモとして残している。
//
// ■useEffectは、初回表示後と依存配列の値が変わった後に実行される。
//
// ■クリーンアップ関数：useEffectの中で return () => { ... } と書いて返す関数。
// 前回のuseEffectで行った処理を後片付けするための関数。
//
// ■クリーンアップ関数は、次に同じuseEffectが実行される直前、
// またはコンポーネントが画面から消える時にReactが実行する。
//
// ■「コンポーネントが画面から消える時」とは、
// そのコンポーネントがReactによって表示対象から外される時のこと。これをアンマウントという。
//   たとえば、別ページへ移動した時、親コンポーネントがその子コンポーネントを表示しなくなった時、
//   {isOpen && <Modal />} の isOpen が false になって <Modal /> 自体が消える時など。
//
// ■旧実装では、isOpenがtrueの時にスクロールを止めて、
// isOpenがfalseに変わる時に、前回のクリーンアップ関数でスクロールを戻していた。
//
// ■Escキー対応の旧実装では、window.addEventListener("keydown", onKeyDown) で
// キー入力の監視を登録し、クリーンアップで removeEventListener によって解除していた。
// addEventListenerで登録したイベントは、不要になったらremoveEventListenerで解除するのが基本。
// isOpen は「モーダルを表示するかどうか」と「キーを監視するかどうか」をまとめて管理する共通のスイッチだった。

export function PrefectureSelect({ value, onChange, disabled, id }: Props) {
  // モーダルが開いているかどうか。この部品の中だけで使う状態なので useState でOK
  const [isOpen, setIsOpen] = useState(false);

  // 選択中の都道府県名を id から探す（未選択なら undefined）
  const selectedName = PREFECTURES.find((p) => p.id === value)?.name;

  // 都道府県を選んだら、親（react-hook-form）に値を渡してモーダルを閉じる
  const selectPrefecture = (prefectureId: number) => {
    onChange(prefectureId);
    setIsOpen(false);
  };

  return (
    <div>
      {/* 開閉トリガー。form の中に置くので type="button" が必須。
          （button は type を省略すると type="submit" 扱いになり、
            タップした瞬間にフォームが送信されてしまう） */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="w-full border-2 border-slate-300 rounded-xl px-3 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-50"
      >
        {selectedName ?? <span className="text-slate-400">選択してください</span>}
      </button>

      {/* 枠は汎用 Modal に任せ、ここでは中身（都道府県ボタン一覧）だけを書く。
          タグの間に書いた JSX が Modal に children として渡る */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="都道府県を選択">
        {/* エリアごとに見出し + 都道府県ボタンの3列グリッドを表示 */}
        {PREFECTURE_AREAS.map((area) => (
          <div key={area.name} className="mb-4">
            <p className="text-xs font-bold text-slate-500 mb-2">{area.name}</p>
            <div className="grid grid-cols-3 gap-2">
              {PREFECTURES.filter((p) => area.prefectureIds.includes(p.id)).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPrefecture(p.id)}
                  // 選択中の県だけ brand-green でハイライトする
                  className={
                    p.id === value
                      ? "border-2 border-brand-green bg-brand-green/10 text-brand-green font-bold rounded-xl px-1 py-3 text-sm"
                      : "border-2 border-slate-300 text-slate-700 rounded-xl px-1 py-3 text-sm"
                  }
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </Modal>
    </div>
  );
}
