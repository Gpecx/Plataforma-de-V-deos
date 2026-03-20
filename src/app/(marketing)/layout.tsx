import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import { AuthProvider } from '@/context/AuthProvider'

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthProvider>
            <div className="flex flex-col min-h-screen bg-transparent">
                <Navbar />

                {/* A classe 'pt-24' (ou pt-[80px]) é essencial aqui. 
                   Como a Navbar é fixed, este padding garante que o 
                   primeiro elemento da página não fique cortado. 
                */}
                <main className="flex-grow pt-24">
                    {children}
                </main>

                <Footer />
            </div>
        </AuthProvider>
    )
}