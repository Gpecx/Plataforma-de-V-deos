import { getSessionUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import LandingPageClient from './LandingPage'

export default async function WelcomePage() {
    const user = await getSessionUser()

    return <LandingPageClient user={user} />
}
