"use client"

import { useEffect } from "react"
import { useCartStore } from "@/store/useCartStore"

interface StoreInitializerProps {
    purchasedCourseIds: string[]
}

export function StoreInitializer({ purchasedCourseIds }: StoreInitializerProps) {
    const setPurchasedCourses = useCartStore(state => state.setPurchasedCourses)

    useEffect(() => {
        setPurchasedCourses(purchasedCourseIds)
    }, [purchasedCourseIds, setPurchasedCourses])

    return null
}
