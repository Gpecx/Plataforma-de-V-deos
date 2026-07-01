import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface LiveHeaderProps {
    title: string;
    subtitle: string;
    backUrl: string;
    isLiveActive: boolean;
}

export const LiveHeader = ({ title, subtitle, backUrl, isLiveActive }: LiveHeaderProps) => {
    return (
        <header className="bg-white border-b border-black/10 px-4 md:px-8 py-4 flex items-center justify-between mb-4 shadow-sm rounded-xl mx-4 md:mx-8 mt-4 shrink-0">
            <div className="flex items-center gap-4">
                <Link href={backUrl as any} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
                    <ChevronLeft size={20} className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-lg md:text-xl font-bold tracking-tighter uppercase text-slate-900">
                        {title}
                    </h1>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        {subtitle}
                    </p>
                </div>
            </div>
            {isLiveActive && (
                <div className="hidden md:flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-1.5 rounded-full">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Ao Vivo</span>
                </div>
            )}
        </header>
    );
};
