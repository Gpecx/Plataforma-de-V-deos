import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Interface para os itens que o ALUNO adiciona ao carrinho
export interface CartItem {
    id: string
    title: string
    price: number
    image_url?: string
}

interface CartStore {
    items: CartItem[]
    purchasedCourseIds: string[]
    notification: { message: string, type: 'error' | 'success' | 'info' } | null
    addItem: (item: CartItem) => void
    setPurchasedCourses: (ids: string[]) => void
    showNotification: (message: string, type?: 'error' | 'success' | 'info', duration?: number) => void
    hideNotification: () => void
    removeItem: (id: string) => void
    clearCart: () => void
    getTotal: () => number
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            purchasedCourseIds: [],
            notification: null,
            addItem: (item) => {
                const currentItems = get().items
                const purchasedIds = get().purchasedCourseIds

                // 1. Impede a adição se o curso já foi comprado
                if (purchasedIds.includes(item.id)) {
                    get().showNotification('Você já possui este curso e não pode comprá-lo novamente.', 'error')
                    return
                }

                // 2. Evita duplicados no carrinho
                if (!currentItems.find((i) => i.id === item.id)) {
                    set({ items: [...currentItems, item] })
                    get().showNotification('✓ Curso adicionado ao carrinho!', 'success')
                }
            },
            showNotification: (message, type = 'info', duration = 3000) => {
                set({ notification: { message, type } })
                setTimeout(() => {
                    set({ notification: null })
                }, duration)
            },
            hideNotification: () => {
                set({ notification: null })
            },
            setPurchasedCourses: (ids: string[]) => {

                set({ purchasedCourseIds: ids })
            },
            removeItem: (id) => {
                set({ items: get().items.filter((i) => i.id !== id) })
            },
            clearCart: () => set({ items: [] }),
            getTotal: () => {
                return get().items.reduce((total, item) => total + item.price, 0)
            },
        }),
        {
            name: 'spcs-cart-storage', // Nome da chave no LocalStorage
        }
    )
)
