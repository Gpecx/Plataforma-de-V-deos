'use client'

import { useState } from 'react'
import { LayoutGrid, PlaySquare } from 'lucide-react'
import CourseApprovalList from './CourseApprovalList'
import LessonApprovalList from './LessonApprovalList'
import { cn } from '@/lib/utils'

interface ApprovalsContentProps {
    pendingCourses: any[]
    lessonsInActiveCourses: any[]
    teachersMap: Record<string, string>
}

export function ApprovalsContent({ 
    pendingCourses, 
    lessonsInActiveCourses, 
    teachersMap 
}: ApprovalsContentProps) {
    const [activeTab, setActiveTab] = useState<'courses' | 'lessons'>('courses')

    const tabs = [
        { 
            id: 'courses', 
            label: 'Cursos Novos', 
            icon: LayoutGrid, 
            count: pendingCourses.length 
        },
        { 
            id: 'lessons', 
            label: 'Aulas Pendentes', 
            icon: PlaySquare, 
            count: lessonsInActiveCourses.length 
        }
    ]

    return (
        <div className="space-y-8">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/5 rounded-none w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-3 px-8 py-3 text-[10px] font-black uppercase tracking-[2px] transition-all duration-300 relative overflow-hidden",
                                isActive 
                                    ? "text-black bg-[#00FF00] shadow-[0_0_15px_rgba(0,255,0,0.3)]" 
                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon size={14} />
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={cn(
                                    "ml-2 px-1.5 py-0.5 rounded-none text-[8px] font-bold",
                                    isActive ? "bg-black text-[#00FF00]" : "bg-white/10 text-slate-400"
                                )}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                {activeTab === 'courses' ? (
                    <CourseApprovalList 
                        initialCourses={pendingCourses} 
                        teachersMap={teachersMap} 
                    />
                ) : (
                    <LessonApprovalList 
                        lessons={lessonsInActiveCourses} 
                        teachersMap={teachersMap} 
                    />
                )}
            </div>
        </div>
    )
}
