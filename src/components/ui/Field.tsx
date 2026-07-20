import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type Common = { label: string; error?: string; hint?: string };

export function Field({ label, error, hint, id, className = '', ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id ?? props.name;
  return <label htmlFor={inputId} className="grid gap-1.5 text-sm font-semibold text-slate-800">
    <span>{label}{props.required && <span className="ml-1 text-red-700" aria-hidden>*</span>}</span>
    <input id={inputId} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} className={`min-h-11 rounded-[12px] border bg-white px-3.5 text-base text-slate-950 placeholder:text-slate-600 hover:border-brand-300 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100 ${error ? 'border-red-600' : 'border-slate-300'} ${className}`} {...props} />
    {error ? <span id={`${inputId}-error`} role="alert" className="text-sm font-medium text-red-700">{error}</span> : hint ? <span className="font-normal text-slate-600">{hint}</span> : null}
  </label>;
}

export function TextareaField({ label, error, id, className = '', ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id ?? props.name;
  return <label htmlFor={inputId} className="grid gap-1.5 text-sm font-semibold text-slate-800">
    <span>{label}</span>
    <textarea id={inputId} aria-invalid={Boolean(error)} className={`min-h-28 rounded-[12px] border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-950 placeholder:text-slate-600 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100 ${className}`} {...props} />
    {error && <span role="alert" className="text-sm font-medium text-red-700">{error}</span>}
  </label>;
}
