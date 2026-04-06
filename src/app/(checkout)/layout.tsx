import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/context/AuthProvider'

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <div className="theme-clean-white min-h-screen flex flex-col bg-white">
                <Suspense fallback={null}>
                    <Navbar light={true} />
                </Suspense>
                <main className="flex-grow pt-24">
                    {children}
                </main>
                <Footer variant="light" />
            </div>
        </AuthProvider>
    )
}
