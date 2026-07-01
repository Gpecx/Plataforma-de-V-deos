import { create } from 'zustand'

interface LiveStore {
    isLiveActive: boolean
    viewers: number
    liveDurationSeconds: number
    setLiveActive: (active: boolean) => void
    setViewers: (count: number) => void
    incrementDuration: () => void
    resetDuration: () => void
}

export const useLiveStore = create<LiveStore>((set) => ({
    isLiveActive: false,
    viewers: 0,
    liveDurationSeconds: 0,
    setLiveActive: (active) => set({ isLiveActive: active }),
    setViewers: (count) => set({ viewers: count }),
    incrementDuration: () => set((state) => ({ liveDurationSeconds: state.liveDurationSeconds + 1 })),
    resetDuration: () => set({ liveDurationSeconds: 0 }),
}))
