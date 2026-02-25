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
                // Evita duplicados no carrinho
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
            name: 'spcs-cart-storage', // Nome da chave no LocalStorage
        }
    )
)