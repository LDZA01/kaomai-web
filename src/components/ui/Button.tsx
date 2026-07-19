import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'small' | 'medium' | 'large';
}

const variantStyle: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
    primary:   { background: 'linear-gradient(135deg, #173A5E, #1e4d7b)', color: '#fff',     boxShadow: '0 2px 8px rgba(23,58,94,0.25)' },
    secondary: { background: '#f0fdfa', color: '#0d9488', border: '1px solid #99f6e4' },
    danger:    { background: '#ef4444', color: '#fff',     boxShadow: '0 2px 6px rgba(239,68,68,0.2)' },
    ghost:     { background: 'transparent', color: '#64748b' },
};

const variantHover: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:   'hover:brightness-110',
    secondary: 'hover:bg-teal-100',
    danger:    'hover:brightness-110',
    ghost:     'hover:bg-slate-100 hover:text-slate-800',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
    small:  'px-3 py-1.5 text-sm',
    medium: 'px-5 py-2.5 text-base',
    large:  'px-7 py-3.5 text-lg',
};

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'medium',
    children,
    className = '',
    style,
    ...props
}) => {
    const base =
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold ' +
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ' +
        'focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95';

    return (
        <button
            className={`${base} ${variantHover[variant]} ${sizeStyles[size]} ${className}`}
            style={{ ...variantStyle[variant], ...style }}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
