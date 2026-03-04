import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-exo">
            <ScrollToTop />
            <Navbar />

            <div className="flex">
                {/* Main Content Area - Full Width optimized */}
                <main className="flex-1 pt-24 transition-all duration-300">
                    <div className="w-full max-w-[1600px] mx-auto px-4 md:px-0">
                        {children}
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    )
}
