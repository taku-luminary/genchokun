"use client";

import { useState } from "react";
import { Modal } from "@/app/_components/ui/Modal";
import { PREFECTURES, PREFECTURE_AREAS } from "@/app/_constants/prefectures";

// PrefectureSelect（単一選択）の複数選択版。
// 単一選択と挙動が根本的に違う（タップで即閉じる vs トグルして「決定」で閉じる）ため、
// 1つのコンポーネントに multiple プロパティで分岐を詰め込まず、別コンポーネントとして分けている。
// モーダルの枠は汎用 Modal に任せ、フォームの値は親（react-hook-form）から
// value / onChange で受け取る「制御されたコンポーネント」なのは単一選択版と同じ。
type Props = {
  value: number[];                    // 選択中の prefectureId の配列（未選択は []）
  onChange: (ids: number[]) => void;  // トグルのたびに新しい配列を親へ渡す
  disabled?: boolean;                 // 送信中はタップできないようにする
  id?: string;                        // Label の htmlFor と紐づける用
};

export function PrefectureMultiSelect({ value, onChange, disabled, id }: Props) {
  // モーダルが開いているかどうか。この部品の中だけで使う状態なので useState でOK
  const [isOpen, setIsOpen] = useState(false);

  // 選択中の都道府県名を「、」区切りで表示する。
  // PREFECTURES は id 昇順に並んでいるので、filter するだけで表示も id 順になる
  const selectedNames = PREFECTURES.filter((p) => value.includes(p.id))
    .map((p) => p.name)
    .join("、");

  // 県をタップしたら選択状態をトグルする（モーダルは閉じない）。
  // 選択済みなら配列から取り除き、未選択なら配列の末尾に追加する。
  // React の state は直接書き換えず「新しい配列を作って渡す」のがルール
  const togglePrefecture = (prefectureId: number) => {
    if (value.includes(prefectureId)) {
      onChange(value.filter((v) => v !== prefectureId));
    } else {
      onChange([...value, prefectureId]);
    }
  };

  return (
    <div>
      {/* 開閉トリガー。form の中に置くので type="button" が必須 */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="w-full border-2 border-slate-300 rounded-xl px-3 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-50"
      >
        {selectedNames || (
          <span className="text-slate-400">選択してください（複数選択可）</span>
        )}
      </button>

      {/* 選択状態はトグルのたびに onChange で親に反映済みなので、
          ×・Esc・背景タップで閉じても「決定」で閉じても選択は保持される */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="対応可能エリアを選択">
        {PREFECTURE_AREAS.map((area) => (
          <div key={area.name} className="mb-4">
            <p className="text-xs font-bold text-slate-500 mb-2">{area.name}</p>
            <div className="grid grid-cols-3 gap-2">
              {PREFECTURES.filter((p) => area.prefectureIds.includes(p.id)).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePrefecture(p.id)}
                  // 選択中の県は brand-green でハイライトする（単一選択版と同じ見た目）
                  className={
                    value.includes(p.id)
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

        {/* 47県で縦に長いため、決定ボタンはモーダル内スクロールに追従させる（sticky）。
            押しても選択が確定するわけではなく、単にモーダルを閉じるだけ */}
        <div className="sticky bottom-0 bg-white pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full bg-brand-green text-white font-bold rounded-xl py-3 text-sm"
          >
            決定（{value.length}件）
          </button>
        </div>
      </Modal>
    </div>
  );
}
