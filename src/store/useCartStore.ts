import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
    id: string
    title: string
    price: number
    image_url?: string
}

interface CartStore {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (id: string) => void
    clearCart: () => void
    getTotal: () => number
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                const currentItems = get().items
                if (!currentItems.find((i) => i.id === item.id)) {
                    set({ items: [...currentItems, item] })
                }
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
            name: 'exs-cart-storage',
        }
    )
)
