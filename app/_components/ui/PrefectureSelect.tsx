"use client";

import { useState, useEffect } from "react";
import { PREFECTURES, PREFECTURE_AREAS } from "@/app/_constants/prefectures";

// このコンポーネントは「開閉トリガーのボタン」と「選択モーダル（小窓）」のセット。
// フォームの値そのものは持たず、親（react-hook-form）から value / onChange を受け取る。
// こういう部品を「制御されたコンポーネント (controlled component)」と呼ぶ。
type Props = {
  value: number | null;                     // 選択中の prefectureId（未選択は null）
  onChange: (prefectureId: number) => void; // 選択されたときに親へ番号を渡す
  disabled?: boolean;                       // 送信中はタップできないようにする
  id?: string;                              // Label の htmlFor と紐づける用
};

export function PrefectureSelect({ value, onChange, disabled, id }: Props) {
  // モーダルが開いているかどうか。この部品の中だけで使う状態なので useState でOK
  const [isOpen, setIsOpen] = useState(false);

  // 選択中の都道府県名を id から探す（未選択なら undefined）
  const selectedName = PREFECTURES.find((p) => p.id === value)?.name;

  // モーダル表示中は背景ページのスクロールを止める
  // （止めないと、モーダル内をスクロールしたときに背後のページまで動いてしまう）
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    // return する関数は「後片付け(クリーンアップ)」。モーダルが閉じたら元に戻す
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ■useEffectは、初回表示後と依存配列の値が変わった後に実行される。

  // ■クリーンアップ関数：useEffectの中で return () => { ... } と書いて返す関数。
  // 前回のuseEffectで行った処理を後片付けするための関数。

  // ■クリーンアップ関数は、次に同じuseEffectが実行される直前、
  // またはコンポーネントが画面から消える時にReactが実行する。

  // ■「コンポーネントが画面から消える時」とは、
  // そのコンポーネントがReactによって表示対象から外される時のこと。これをアンマウントという。
    // たとえば、別ページへ移動した時、親コンポーネントがその子コンポーネントを表示しなくなった時、
    // {isOpen && <Modal />} の isOpen が false になって <Modal /> 自体が消える時など。

  // ■今回の場合、isOpenがtrueの時にスクロールを止めて、
  // isOpenがfalseに変わる時に、前回のクリーンアップ関数でスクロールを戻している。

  // Esc キーで閉じる（PCユーザー向け）
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

// ■ 各コードの意味//
// ・const onKeyDown = (e: KeyboardEvent) => { ... } は、
//   キーボードが押されたときに実行したい処理を関数として用意している。
//   onKeyDownはただの関数名であり、この時点ではまだ実行されていない。
//
// ・eは「イベント情報」どのキーが押されたか、ShiftやCtrlキーも同時に押されているか、などの情報が入っている。
// ・e.key === "Escape" は、「押されたキーがEscapeキーだったら」という意味。
//
// ・window.addEventListener("keydown", onKeyDown); は、
//   window、つまりブラウザ画面全体に対して、
//   「キーボードのキーが押されたらonKeyDownを実行して」と登録している。
//   そのため、コード上でonKeyDown();と直接呼び出していなくても、
//   ユーザーがキーを押したタイミングでブラウザが自動的にonKeyDownを実行する。
// 
//   window.addEventListener("keydown", onKeyDown); が実行されると、
//   windowにkeydownイベントの監視処理が登録される。
//   登録後は、window上でキーボードのキーが押されるたびに、ブラウザがonKeyDown関数を自動的に実行する。
//   ただし、JavaScriptが常にループしながらキー入力を確認しているわけではない。
//   ブラウザのイベント機能にonKeyDownを登録しておき、
//   実際にキー入力が起きたタイミングだけブラウザが関数を呼び出す。
//   この登録は、removeEventListenerで解除されるまで有効。
//   今回はモーダルが開いてisOpenがtrueになったときに登録され、
//   isOpenがfalseに変わるときのクリーンアップで解除される。
//   そのため、モーダルが開いている間だけ、window上のキー入力に反応する状態になる。
// 
// ・"keydown"は、「キーボードのキーが押されたとき」を表すイベント名。
//
// ・return () => window.removeEventListener("keydown", onKeyDown); は、
//   useEffectのクリーンアップ関数。
//   前回のuseEffectでwindowに登録したkeydownイベントを解除する。
//
//   「モーダルが閉じたこと」を直接検知して実行されるわけではない。
//   正確には、依存配列のisOpenが変化してuseEffectが再実行される前に、
//   前回のuseEffectを後片付けするために実行される。
//
//   今回は、isOpenがtrueのときにkeydownイベントを登録し、
//   isOpenがfalseに変わるときに前回登録したイベントを解除している。
//
//   addEventListenerで登録したイベントは、
//   不要になったらremoveEventListenerで解除するのが基本。
//
// ■ このuseEffectとモーダルは、どこで紐づいているのか
//   このuseEffectがモーダルのHTMLを直接探したり、特定のモーダル要素と直接接続したりしているわけではない。
//   useEffectとモーダル表示は、どちらも同じisOpenという状態を使うことで、間接的に紐づいている。
//   useEffect側では、次のコードによって、isOpenがtrueのときだけEscapeキーの監視を始める。
//   if (!isOpen) return;
//   JSX側では、次の条件によって、isOpenがtrueのときだけモーダルを表示する。
//
//   {isOpen && (
//     モーダルのJSX
//   )}
//
//   つまり、isOpenは次の2つをまとめて管理する共通のスイッチになっている。
//   ・モーダルを表示するかどうか
//   ・Escapeキーを監視するかどうか
//
// ■ 今回の流れ
//   1. setIsOpen(true)が実行される
//   2. isOpenがtrueになる
//   3. Reactが再レンダリングする
//   4. {isOpen && (...)}の条件がtrueなのでモーダルが表示される
//   5. レンダリング後にuseEffectが実行される
//   6. windowにkeydownイベントが登録される
//   7. Escapeキーが押される
//   8. ブラウザがonKeyDownを自動的に実行する
//   9. setIsOpen(false)が実行される
//  10. isOpenがtrueからfalseに変わる
//  11. Reactが再レンダリングする
//  12. {isOpen && (...)}の条件がfalseになり、モーダルが表示されなくなる
//  13. isOpenの変化によりuseEffectがやり直される
//  14. 新しいuseEffectの処理が行われる前に、前回のクリーンアップ関数が実行される
//  15. window.removeEventListener("keydown", onKeyDown)によって、
//      前回登録したkeydownイベントが解除される
//  16. 新しいuseEffectではisOpenがfalseなので、
//      if (!isOpen) return;で終了する
//
// ■ クリーンアップ関数が実行される主なタイミング
//   1. 依存配列の値が変わり、同じuseEffectが再実行される前
//   2. このuseEffectを持つコンポーネント自体が画面から外れるとき
//
//   今回は主に、isOpenがtrueからfalseに変化したことで、
//   1のタイミングでクリーンアップ関数が実行されている。


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

      {/* isOpen が true のときだけモーダルを描画する（条件レンダリング） */}
      {isOpen && (
        // fixed inset-0 → 画面全体に固定表示。
        // z-[60] → Header が z-50 なので、それより手前に出すため
        // items-end → スマホでは画面下からのシート表示 / md:items-center → PCでは中央表示
        <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-4">
          {/* 背景の半透明オーバーレイ。タップしたら閉じる */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          />

          {/* パネル本体。relative を付けることで背景（absolute）より手前に出る */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-h-[80vh] overflow-y-auto bg-white rounded-t-2xl p-4 md:max-w-md md:rounded-2xl"
          >
            {/* ヘッダー行: タイトル + 閉じるボタン */}
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-slate-800">都道府県を選択</p>
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => setIsOpen(false)}
                className="w-11 h-11 flex items-center justify-center text-slate-400 text-2xl"
              >
                ×
              </button>
            </div>

            {/* エリアごとに見出し + 都道府県ボタンの3列グリッドを表示 */}
            {PREFECTURE_AREAS.map((area) => (
              <div key={area.name} className="mb-4">
                <p className="text-xs font-bold text-slate-500 mb-2">{area.name}</p>
                <div className="grid grid-cols-3 gap-2">
                  {PREFECTURES.filter((p) => area.prefectureIds.includes(p.id)).map(
                    (p) => (
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
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
