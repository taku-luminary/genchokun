type Props = React.ComponentPropsWithoutRef<"button">;

export function Button({ children, ...props }: Props) {
  return (
    <button
      className="w-full bg-brand-green text-white font-bold py-3 rounded-xl
hover:opacity-90 transition disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}