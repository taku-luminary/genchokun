type Props = React.ComponentPropsWithoutRef<"input">;

export function Input({ ...props }: Props) {
  return (
    <input
      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm
focus:outline-none focus:ring-2 focus:ring-brand-green"
      {...props}
    />
  );
}
