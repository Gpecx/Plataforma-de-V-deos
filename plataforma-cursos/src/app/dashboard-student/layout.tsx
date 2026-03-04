import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#F3F4F6] text-slate-800 font-exo overflow-x-hidden">
            <ScrollToTop />
            <Navbar />

            <div className="flex flex-col min-h-screen">
                {/* Main Content Area - Full Width optimized */}
                <main className="flex-1 pt-4 transition-all duration-300">
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    )
}
