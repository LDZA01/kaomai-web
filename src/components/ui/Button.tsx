import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'medium', children, className = '', ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95';
    const variantStyles = {
        primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-300 focus:ring-blue-300',
        secondary: 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 focus:ring-emerald-200',
        danger: 'bg-red-500 text-white shadow-md shadow-red-100 hover:bg-red-600 hover:shadow-red-200 focus:ring-red-200',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200',
    };
    const sizeStyles = {
        small: 'px-3 py-1.5 text-sm',
        medium: 'px-5 py-2.5 text-base',
        large: 'px-7 py-3.5 text-lg',
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
