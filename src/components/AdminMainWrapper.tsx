'use client'

import { usePathname } from 'next/navigation'

export default function AdminMainWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isClassroom = pathname.includes('/admin/classroom')

    if (isClassroom) {
        return (
            <main className="relative z-10 pl-72 min-h-screen w-full" style={{ backgroundColor: '#0a101f' }}>
                <div className="w-full min-h-screen">
                    {children}
                </div>
            </main>
        )
    }

    return (
        <main className="relative z-10 pl-72 min-h-screen" style={{ backgroundColor: '#ffffff' }}>
            <div className="p-8 md:p-12">
                {children}
            </div>
        </main>
    )
}
