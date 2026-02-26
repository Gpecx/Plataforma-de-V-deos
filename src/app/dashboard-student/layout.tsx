import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#061629] text-white">
            <Navbar />

            {/* Main Content Area */}
            <main className="pt-24">
                {children}
            </main>

            <Footer />
        </div>
    )
}
