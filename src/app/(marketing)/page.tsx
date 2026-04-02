import { getSessionUser } from '@/app/actions/auth'
import { getFeaturedCourses } from './actions'
import LandingPageClient from './LandingPage'

export default async function WelcomePage() {
    const user = await getSessionUser()
    const courses = await getFeaturedCourses()

    return <LandingPageClient user={user} initialCourses={courses} />
}
