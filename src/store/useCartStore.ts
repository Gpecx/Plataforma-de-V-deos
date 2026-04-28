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
    checkoutResult: any | null
    addItem: (item: CartItem) => void
    setPurchasedCourses: (ids: string[]) => void
    showNotification: (message: string, type?: 'error' | 'success' | 'info', duration?: number) => void
    hideNotification: () => void
    removeItem: (id: string) => void
    clearCart: () => void
    getTotal: () => number
    syncPrices: (freshPrices: { id: string, price: number }[]) => void
    validateItems: (validIds: string[]) => void
    setCheckoutResult: (result: any) => void
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            purchasedCourseIds: [],
            notification: null,
            checkoutResult: null,
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
                return get().items.reduce((total, item) => total + (Number(item.price) || 0), 0)
            },
            syncPrices: (freshPrices) => {
                const currentItems = get().items
                let changed = false
                const newItems = currentItems.map(item => {
                    const fresh = freshPrices.find(f => f.id === item.id)
                    if (fresh && fresh.price !== item.price) {
                        changed = true
                        return { ...item, price: fresh.price }
                    }
                    return item
                })
                if (changed) {
                    set({ items: newItems })
                }
            },
            validateItems: (validIds) => {
                const currentItems = get().items
                const newItems = currentItems.filter(item => validIds.includes(item.id))
                if (newItems.length !== currentItems.length) {
                    set({ items: newItems })
                }
            },
            setCheckoutResult: (result) => set({ checkoutResult: result }),
        }),
        {
            name: 'spcs-cart-storage',
            partialize: (state) => ({ items: state.items }),
        }
    )
)
