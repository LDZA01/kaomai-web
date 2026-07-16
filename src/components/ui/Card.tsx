import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    imageUrl?: string;
    skills?: string[];
}

const Card: React.FC<CardProps> = ({ title, description, imageUrl, skills, children, className = '', ...props }) => {
    return (
        <div
            className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-slide-up ${className}`}
            {...props}
        >
            {imageUrl && (
                <div className="mb-4 overflow-hidden rounded-xl">
                    <img src={imageUrl} alt={title || ''} className="h-36 w-full object-cover transition-transform duration-300 hover:scale-105" />
                </div>
            )}
            {title && <h2 className="text-lg font-bold text-slate-900">{title}</h2>}
            {description && <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>}
            {skills && skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {skills.map((skill, index) => (
                        <span
                            key={index}
                            className="inline-block rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            )}
            {children}
        </div>
    );
};

export default Card;
