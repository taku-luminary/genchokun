type Props = {
  name: string;                        // 同じ name のラジオが1つのグループになる
  value: boolean | null;               // null はまだ選んでいない状態（どちらにもチェックが付かない）
  onChange: (value: boolean) => void;
  yesLabel: string;                    // 例: "加入あり"
  noLabel: string;                     // 例: "加入なし"
  disabled?: boolean;
};

// 「はい／いいえ」を選ぶ2択のラジオボタン。
// DB の Boolean?（true / false / null）とそのまま対応させるため、値を boolean で受け渡しする。
// フォームの値は親（react-hook-form の Controller）から value / onChange で受け取る
export function BooleanRadio({ name, value, onChange, yesLabel, noLabel, disabled }: Props) {
  return (
    <div className="flex flex-col">
      <label className="flex min-h-11 cursor-pointer items-center gap-2">
        <input
          type="radio"
          name={name}
          checked={value === true}
          onChange={() => onChange(true)}
          disabled={disabled}
          className="size-4 accent-brand-green"
        />
        <span className="text-sm text-slate-700">{yesLabel}</span>
      </label>
      <label className="flex min-h-11 cursor-pointer items-center gap-2">
        <input
          type="radio"
          name={name}
          checked={value === false}
          onChange={() => onChange(false)}
          disabled={disabled}
          className="size-4 accent-brand-green"
        />
        <span className="text-sm text-slate-700">{noLabel}</span>
      </label>
    </div>
  );
}
