type Props = React.ComponentPropsWithoutRef<"input">;
                                                                                                                                                      
export function Input({ ...props }: Props) {
  return (                                                                                                                                          
    <input                       
      className="w-full border-2 border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
      {...props}                                                                                                                                    
    />
  );                                                                                                                                                
}         
