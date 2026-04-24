import { create } from 'zustand'

export interface Lesson {
    title: string
    video_url: string
    position: number
    description?: string
    mux_upload_id?: string
    mux_playback_id?: string
    mux_asset_id?: string
}

interface CourseFormData {
    title: string
    category: string
    subtitle: string
    description: string
    price: number
    pricing_type: 'premium' | 'free' | 'standard'
    duration: number
    image_url?: string
    intro_video_url?: string
    intro_video_mux_id?: string
    intro_video_asset_id?: string
    intro_video_playback_id?: string
    curriculum: string[]
    lessons: Lesson[]
    tags: string[]
}

interface CourseFormStore {
    formData: CourseFormData
    setStepData: (data: Partial<CourseFormData>) => void
    setLessons: (lessons: Lesson[]) => void
    resetForm: () => void
}

const defaultFormData: CourseFormData = {
    title: '',
    category: '',
    subtitle: '',
    description: '',
    price: 0,
    pricing_type: 'standard',
    duration: 0,
    intro_video_url: '',
    intro_video_mux_id: '',
    intro_video_asset_id: '',
    intro_video_playback_id: '',
    curriculum: [],
    lessons: [],
    tags: []
}

export const useCourseFormStore = create<CourseFormStore>((set) => ({
    formData: defaultFormData,
    setStepData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
    })),
    setLessons: (lessons) => set((state) => ({
        formData: { ...state.formData, lessons }
    })),
    resetForm: () => set({ formData: defaultFormData }),
}))