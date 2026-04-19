type Props = React.ComponentPropsWithoutRef<"label">;

export function Label({ children, ...props }: Props) {
  return (
    <label className="block text-sm font-bold text-slate-600 mb-1" {...props}>
      {children}
    </label>
  );
}