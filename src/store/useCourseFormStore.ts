import { create } from 'zustand'

export interface Lesson {
    title: string
    video_url: string
    position: number
}

interface CourseFormData {
    title: string
    category: string
    subtitle: string
    description: string
    price: number
    duration: number
    image_url?: string
    intro_video_url?: string
    lessons: Lesson[]
}

interface CourseFormStore {
    formData: CourseFormData
    setStepData: (data: Partial<CourseFormData>) => void
    setLessons: (lessons: Lesson[]) => void
    resetForm: () => void
}

export const useCourseFormStore = create<CourseFormStore>((set) => ({
    formData: {
        title: '',
        category: '',
        subtitle: '',
        description: '',
        price: 157.00,
        duration: 0,
        intro_video_url: '',
        lessons: []
    },
    setStepData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
    })),
    setLessons: (lessons) => set((state) => ({
        formData: { ...state.formData, lessons }
    })),
    resetForm: () => set({
        formData: {
            title: '',
            category: '',
            subtitle: '',
            description: '',
            price: 157.00,
            duration: 0,
            intro_video_url: '',
            lessons: []
        }
    }),
}))