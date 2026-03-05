import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#F8F9FA] text-slate-800 font-exo">
            <Navbar />

            <div className="flex">
                {/* Main Content Area - Full Width optimized */}
                <main className="flex-1 pt-0 transition-all duration-300">
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    )
}
