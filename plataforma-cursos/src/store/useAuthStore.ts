import { create } from 'zustand'

export type UserRole = "admin" | "teacher" | "student";

interface User {
    uid: string;
    email: string;
    role: UserRole;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (isLoading: boolean) => void;
    clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: false, // Inicia como false para evitar travamento na tela de login
    setUser: (user) => set({ user, isLoading: false }),
    setLoading: (isLoading) => set({ isLoading }),
    clearUser: () => set({ user: null, isLoading: false }),
}))
