import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import InstructorProfile from '@/components/InstructorProfile'
import { getInstructorProfile, getInstructorStats, getInstructorCourses } from '@/app/actions/instructor'
import { MotivationalBanner } from '@/components/MotivationalBanner'

interface Props {
    params: {
        id: string
    }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function InstructorPage({ params }: Props) {
    const { id } = await params

    // Fetch data in parallel for performance
    const [instructor, stats, coursesResult] = await Promise.all([
        getInstructorProfile(id),
        getInstructorStats(id),
        getInstructorCourses(id, 10)
    ])

    if (!instructor) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-[#F4F7F9]">
            <Navbar />
            
            <main className="pt-8 text-slate-900">
                <InstructorProfile 
                    instructor={instructor}
                    stats={stats}
                    initialCourses={coursesResult.courses}
                    initialLastId={coursesResult.lastId}
                    initialHasMore={coursesResult.hasMore}
                />
            </main>

            <MotivationalBanner />
            <Footer />
        </div>
    )
}
