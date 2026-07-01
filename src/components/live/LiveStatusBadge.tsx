import React from 'react';

interface LiveStatusBadgeProps {
    variant?: 'header' | 'video';
}

export const LiveStatusBadge = ({ variant = 'header' }: LiveStatusBadgeProps) => {
    if (variant === 'header') {
        return (
            <div className="hidden md:flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-1.5 rounded-full">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Ao Vivo</span>
            </div>
        );
    }

    return (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-md shadow-md">
            <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Ao Vivo</span>
        </div>
    );
};
