"use client"

import { useEffect, useState, useRef } from "react"
import { useProgressStore } from "@/store/useProgressStore"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getAllUserProgress } from "@/app/(app)/dashboard-student/actions"

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
                const result = await getAllUserProgress()
                
                if (result.success && result.data) {
                    const serverProgress = result.data
                    const progressMap: Record<string, any> = {}

                    Object.entries(serverProgress).forEach(([courseId, data]: [string, any]) => {
                        if (courseLessonsCount[courseId]) {
                            progressMap[courseId] = {
                                ...data,
                                totalLessons: courseLessonsCount[courseId] || 0
                            }
                        }
                    })
                    setAllProgress(progressMap)
                }
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

export function useUpdateLastProgress(courseId: string, lessonId: string, timestamp: number) {
    const updateLastProgress = useProgressStore(state => state.updateLastProgress)
    const lastSaveRef = useRef<number>(0)
    const isUpdatingRef = useRef(false)

    useEffect(() => {
        const now = Date.now()
        if (now - lastSaveRef.current < 2000 || isUpdatingRef.current) return

        isUpdatingRef.current = true
        lastSaveRef.current = now

        updateLastProgress(courseId, lessonId, timestamp)

        const saveToFirestore = async () => {
            try {
                const { doc, setDoc, getDoc } = await import('firebase/firestore')
                const { auth } = await import('@/lib/firebase')
                const { currentUser } = auth

                if (!currentUser) return

                const progressRef = doc(db, 'userProgress', `${currentUser.uid}_${courseId}`)
                const existingDoc = await getDoc(progressRef)

                const updateData = {
                    userId: currentUser.uid,
                    courseId: courseId,
                    lastLessonId: lessonId,
                    lastTimestamp: timestamp,
                    updatedAt: new Date()
                }

                await setDoc(progressRef, updateData, { merge: true })
            } catch (error) {
                console.error('Erro ao salvar progresso:', error)
            } finally {
                isUpdatingRef.current = false
            }
        }

        saveToFirestore()
    }, [courseId, lessonId, timestamp, updateLastProgress])
}