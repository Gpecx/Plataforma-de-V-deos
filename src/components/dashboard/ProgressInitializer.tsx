"use client"

import { useEffect, useState } from "react"
import { useProgressStore } from "@/store/useProgressStore"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"

interface ProgressInitializerProps {
    purchasedCourseIds: string[]
    courseLessonsCount: Record<string, number>
}

export function ProgressInitializer({ purchasedCourseIds, courseLessonsCount }: ProgressInitializerProps) {
    const setAllProgress = useProgressStore(state => state.setAllProgress)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setIsLoading(false)
                return
            }

            try {
                const progressRef = collection(db, 'userProgress')
                const q = query(progressRef, where('userId', '==', user.uid))
                const snapshot = await getDocs(q)

                const progressMap: Record<string, { completedLessons: string[], totalLessons: number }> = {}

                snapshot.forEach(doc => {
                    const data = doc.data()
                    const courseId = data.courseId
                    if (courseId && courseLessonsCount[courseId]) {
                        progressMap[courseId] = {
                            completedLessons: data.completedLessons || [],
                            totalLessons: courseLessonsCount[courseId] || 0
                        }
                    }
                })

                setAllProgress(progressMap)
            } catch (error) {
                console.error('Erro ao buscar progresso:', error)
            } finally {
                setIsLoading(false)
            }
        })

        return () => unsubscribe()
    }, [purchasedCourseIds, courseLessonsCount, setAllProgress])

    return null
}