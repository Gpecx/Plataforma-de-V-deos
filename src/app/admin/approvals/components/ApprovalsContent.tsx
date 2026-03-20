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
            <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-4 px-10 py-4 text-[10px] font-black uppercase tracking-[3px] transition-all duration-300 rounded-xl relative",
                                isActive 
                                    ? "text-white bg-[#1D5F31] shadow-xl shadow-[#1D5F31]/20" 
                                    : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            <Icon size={16} strokeWidth={2.5} />
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={cn(
                                    "ml-3 px-2 py-0.5 rounded-md text-[9px] font-black",
                                    isActive ? "bg-white text-[#1D5F31]" : "bg-slate-100 text-slate-500"
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
