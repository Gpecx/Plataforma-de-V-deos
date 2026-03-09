'use client'

import { createContext, useContext, ReactNode } from 'react'
import { BrandingData } from '@/app/admin/settings/actions'

// Default branding values (used before data loads)
export const DEFAULT_BRANDING: BrandingData = {
    logoUrl: '',
    siteName: 'SPCS Academy',
    theme: 'modern',
    primaryColor: '#00C402',
}

const BrandingContext = createContext<BrandingData>(DEFAULT_BRANDING)

export function BrandingProvider({ children, value }: { children: ReactNode; value: BrandingData }) {
    return (
        <BrandingContext.Provider value={value}>
            {/* Inject dynamic CSS variables for primaryColor */}
            <style>{`
                :root {
                    --color-primary: ${value.primaryColor};
                    --color-primary-hover: ${value.primaryColor}CC;
                }
                [data-theme="${value.theme}"] {
                    font-family: ${value.theme === 'classic' ? '"Georgia", serif' : value.theme === 'minimalist' ? '"Inter", sans-serif' : '"Exo 2", sans-serif'};
                }
            `}</style>
            {children}
        </BrandingContext.Provider>
    )
}

export function useBranding() {
    return useContext(BrandingContext)
}
