import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

const Input: React.FC<InputProps> = ({ label, hint, id, ...props }) => {
  const inputId = id || label;
  return (
    <div className="flex flex-col mb-4">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 text-sm font-semibold text-slate-700">
          {label}
          {props.required && <span className="ml-1 text-red-400">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-slate-300"
        {...props}
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
};

export default Input;
