type Props = React.ComponentPropsWithoutRef<"textarea">;

export function Textarea({ ...props }: Props) {
  return (
    <textarea
      className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
      {...props}
    />
  );
}
