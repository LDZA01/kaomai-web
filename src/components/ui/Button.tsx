import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; size?: 'sm' | 'md' | 'lg' };

export const Button = forwardRef<HTMLButtonElement, Props>(function Button({ variant = 'primary', size = 'md', className = '', ...props }, ref) {
  const variants = {
    primary: 'bg-brand-600 text-white shadow-[0_3px_6px_oklch(55%_0.2_260_/_0.2)] hover:bg-brand-700 active:bg-brand-700 active:translate-y-px',
    secondary: 'border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 active:bg-brand-100',
    danger: 'bg-red-700 text-white hover:bg-red-800',
    ghost: 'text-slate-700 hover:bg-brand-50 hover:text-brand-700',
  };
  const sizes = { sm: 'min-h-10 px-3 text-sm', md: 'min-h-11 px-4 text-sm', lg: 'min-h-12 px-6 text-base' };
  return <button ref={ref} className={`inline-flex items-center justify-center gap-2 rounded-[10px] font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
});
