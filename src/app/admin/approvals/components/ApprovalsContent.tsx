'use client'

import { useState } from 'react'
import { LayoutGrid, PlaySquare, Trash2 } from 'lucide-react'
import CourseApprovalList from './CourseApprovalList'
import LessonApprovalList from './LessonApprovalList'
import DeletionApprovalList from './DeletionApprovalList'
import { cn } from '@/lib/utils'

interface ApprovalsContentProps {
    pendingCourses: any[]
    lessonsInActiveCourses: any[]
    teachersMap: Record<string, string>
    deletionPendingCourses: any[]
    deletionPendingLessons: any[]
}

export function ApprovalsContent({ 
    pendingCourses, 
    lessonsInActiveCourses, 
    teachersMap,
    deletionPendingCourses,
    deletionPendingLessons
}: ApprovalsContentProps) {
    const [activeTab, setActiveTab] = useState<'courses' | 'lessons' | 'deletions'>('courses')

    const deletionCount = deletionPendingCourses.length + deletionPendingLessons.length

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
        },
        { 
            id: 'deletions', 
            label: 'Exclusões', 
            icon: Trash2, 
            count: deletionCount 
        }
    ]

    return (
        <div className="space-y-8">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 p-1.5 bg-white border border-black/20 rounded-xl w-fit shadow-sm overflow-hidden">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-4 px-8 py-3.5 text-[10px] uppercase font-bold tracking-wider transition-all duration-300 rounded-lg relative",
                                isActive 
                                    ? "text-white bg-[#1D5F31] shadow-sm" 
                                    : "!text-[#000000] hover:!text-[#000000] hover:bg-slate-100"
                            )}
                        >
                            <Icon size={16} strokeWidth={isActive ? 3 : 2} />
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={cn(
                                    "ml-3 px-2 py-0.5 rounded-md text-[9px] font-bold",
                                    isActive ? "bg-white text-[#1D5F31]" : "bg-slate-200 !text-[#000000]"
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
                ) : activeTab === 'lessons' ? (
                    <LessonApprovalList 
                        lessons={lessonsInActiveCourses} 
                        teachersMap={teachersMap} 
                    />
                ) : (
                    <DeletionApprovalList 
                        pendingCourses={deletionPendingCourses}
                        pendingLessons={deletionPendingLessons}
                        teachersMap={teachersMap}
                    />
                )}
            </div>
        </div>
    )
}
