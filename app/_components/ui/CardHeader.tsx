type Props = {
  title: string;
  subtitle?: string;
};

// カード全体の見出し。下線を引いてカード内の各項目名と区別し、「このカードが何の情報か」を示す
export function CardHeader({ title, subtitle }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 pb-3">
      <h2 className="text-base font-bold text-slate-700">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
