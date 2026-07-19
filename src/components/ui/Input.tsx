import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;      // inline error message
  success?: boolean;   // show green border + checkmark
}

const Input: React.FC<InputProps> = ({ label, hint, error, success, id, ...props }) => {
  const inputId = id || label;

  const borderClass = error
    ? 'border-red-400 focus:border-red-400 focus:ring-red-100 bg-red-50'
    : success
    ? 'border-green-400 focus:border-green-400 focus:ring-green-100'
    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100 hover:border-slate-300';

  return (
    <div className="flex flex-col mb-3">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 text-sm font-semibold text-slate-700">
          {label}
          {props.required && <span className="ml-1 text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:ring-2 ${borderClass} ${success ? 'pr-10' : ''}`}
          {...props}
        />
        {success && (
          <CheckCircle2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none"
          />
        )}
        {error && (
          <AlertCircle
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none"
          />
        )}
      </div>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
          {error}
        </p>
      )}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
};

export default Input;
