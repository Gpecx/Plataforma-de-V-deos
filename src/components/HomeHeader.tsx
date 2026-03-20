'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthProvider'

export default function HomeHeader() {
    const { user } = useAuth()
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Só exibe na página inicial e após hidratação
    if (pathname !== '/' || !mounted) return null

    return createPortal(
        <header
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 99999,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem 2rem',
                pointerEvents: 'auto',
            }}
        >
            <Logo className="h-8 md:h-10" href={user ? '/course' : '/'} />

            {!user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link href="/login">
                        <button
                            style={{
                                fontSize: '0.65rem',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                border: '1px solid rgba(255,255,255,0.25)',
                                color: '#fff',
                                background: 'transparent',
                                padding: '0.5rem 1.25rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            Login
                        </button>
                    </Link>
                    <Link href="/register">
                        <button
                            style={{
                                fontSize: '0.65rem',
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                background: '#1D5F31',
                                color: '#fff',
                                border: '2px solid #1D5F31',
                                padding: '0.5rem 1.25rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'background 0.2s, transform 0.2s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#28b828'
                                e.currentTarget.style.transform = 'scale(1.03)'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#1D5F31'
                                e.currentTarget.style.transform = 'scale(1)'
                            }}
                        >
                            Inscreva-se
                        </button>
                    </Link>
                </div>
            )}
        </header>,
        document.body
    )
}
