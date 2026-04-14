import { create } from 'zustand'

interface CourseProgress {
    completedLessons: string[]
    totalLessons: number
    lastLessonId?: string
    lastTimestamp?: number
}

interface ProgressStore {
    courseProgress: Record<string, CourseProgress>
    setCourseProgress: (courseId: string, data: CourseProgress) => void
    setAllProgress: (progress: Record<string, CourseProgress>) => void
    updateLastProgress: (courseId: string, lessonId: string, timestamp: number) => void
}

export const useProgressStore = create<ProgressStore>((set) => ({
    courseProgress: {},
    setCourseProgress: (courseId, data) => set((state) => ({
        courseProgress: {
            ...state.courseProgress,
            [courseId]: data
        }
    })),
    setAllProgress: (progress) => set({ courseProgress: progress }),
    updateLastProgress: (courseId, lessonId, timestamp) => set((state) => ({
        courseProgress: {
            ...state.courseProgress,
            [courseId]: {
                ...state.courseProgress[courseId],
                lastLessonId: lessonId,
                lastTimestamp: timestamp
            }
        }
    }))
}))