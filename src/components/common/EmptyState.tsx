import React from 'react';

const EmptyState: React.FC<{ message?: string }> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <svg
                className="w-24 h-24 mb-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700">
                {message || 'No data available'}
            </h2>
            <p className="text-gray-500">
                Please check back later or add new entries.
            </p>
        </div>
    );
};

export default EmptyState;