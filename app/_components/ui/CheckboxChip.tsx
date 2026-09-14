type Props = React.ComponentPropsWithoutRef<"input"> & {
  label: string;
};

// タップしやすいチップ型のチェックボックス。
// label で input ごと包むので、チップのどこをタップしてもチェックが切り替わる。
// Input と同じく残りの props を input にそのまま渡すので、{...register("qualifications")} をそのまま使える
export function CheckboxChip({ label, ...props }: Props) {
  return (
    <label className="group/chip inline-flex max-w-full min-h-11 cursor-pointer items-center gap-1 rounded-3xl border-2 border-slate-300 bg-white px-3.5 py-2 text-sm leading-snug text-slate-700 transition has-checked:border-brand-green has-checked:bg-brand-green has-checked:font-bold has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-brand-green has-focus-visible:ring-offset-2 has-disabled:cursor-not-allowed has-disabled:opacity-50">
      {/* 本物のチェックボックスは見た目だけ隠し、キーボード操作や読み上げでは使えるように残す */}
      <input type="checkbox" className="sr-only" {...props} />
      {/* 色だけに頼らず、選択中であることを記号でも示す */}
      <span aria-hidden="true" className="hidden group-has-checked/chip:inline">✓</span>
      <span>{label}</span>
    </label>
  );
}
