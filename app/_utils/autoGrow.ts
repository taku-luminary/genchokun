/**
 * textarea の高さを中身に合わせて調整する（縦方向のみ）。
 * いったん height:auto に戻してから scrollHeight を測るので、
 * 文字を増やせば伸び、削れば縮む（両方向に追従する）。
 * 高さの下限は className 側（min-h-* など）で指定する前提。
 * 編集フォームなど「初期値を入れた直後に一度合わせたい」ときにも使える。
 */
export function resizeTextareaEl(el: HTMLElement | null) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/** onInput に渡して、入力のたびに高さを自動調整する。 */
export function autoGrowTextarea(e: { currentTarget: HTMLTextAreaElement }) {
  resizeTextareaEl(e.currentTarget);
}
