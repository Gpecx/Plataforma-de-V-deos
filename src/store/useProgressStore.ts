import { create } from 'zustand'

interface ProgressStore {
    courseProgress: Record<string, { completedLessons: string[], totalLessons: number }>
    setCourseProgress: (courseId: string, data: { completedLessons: string[], totalLessons: number }) => void
    setAllProgress: (progress: Record<string, { completedLessons: string[], totalLessons: number }>) => void
}

export const useProgressStore = create<ProgressStore>((set) => ({
    courseProgress: {},
    setCourseProgress: (courseId, data) => set((state) => ({
        courseProgress: {
            ...state.courseProgress,
            [courseId]: data
        }
    })),
    setAllProgress: (progress) => set({ courseProgress: progress })
}))