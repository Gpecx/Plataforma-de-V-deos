import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Interface para os itens que o ALUNO adiciona ao carrinho
export interface CartItem {
    id: string
    title: string
    price: number
    image_url?: string
    bundle_id?: string
    course_ids?: string[]
}

interface CartStore {
    items: CartItem[]
    purchasedCourseIds: string[]
    notification: { message: string, type: 'error' | 'success' | 'info' } | null
    checkoutResult: any | null
    addItem: (item: CartItem, purchasedIdsOverride?: string[]) => void
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
    addItem: (item: CartItem, purchasedIdsOverride?: string[]) => {
                const currentItems = get().items
                const purchasedIds = purchasedIdsOverride || get().purchasedCourseIds

                // 1. Impede a adição se o curso já foi comprado
                if (purchasedIds.includes(item.id)) {
                    get().showNotification('Acesso verificado: Você já possui este curso.', 'error', 4000)
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
                const currentItems = get().items
                const itemsToRemove = currentItems.filter(item => ids.includes(item.id))
                
                if (itemsToRemove.length > 0) {
                    const filteredItems = currentItems.filter(item => !ids.includes(item.id))
                    set({ 
                        items: filteredItems, 
                        purchasedCourseIds: ids 
                    })
                    
                    // Mensagem Industrial: Cantos retos serão aplicados no componente
                    if (itemsToRemove.length === 1) {
                        get().showNotification('Acesso verificado: Você já possui este curso. O item foi removido do carrinho.', 'info', 6000)
                    } else {
                        get().showNotification('Acesso verificado: Alguns cursos já adquiridos foram removidos do seu carrinho.', 'info', 6000)
                    }
                } else {
                    set({ purchasedCourseIds: ids })
                }
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
