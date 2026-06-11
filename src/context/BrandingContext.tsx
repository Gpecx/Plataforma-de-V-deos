'use client'

import { createContext, useContext, ReactNode } from 'react'
import { BrandingData } from '@/app/admin/settings/actions'

// Default branding values (used before data loads)
export const DEFAULT_BRANDING: BrandingData = {
    logoUrl: '',
    siteName: 'PowerPlay',
    primaryColor: '#1D5F31',
}

const BrandingContext = createContext<BrandingData>(DEFAULT_BRANDING)

export function BrandingProvider({ children, value }: { children: ReactNode; value: BrandingData }) {
    // SEC: Sanitize primaryColor to prevent CSS injection
    const safePrimaryColor = value.primaryColor?.replace(/[^a-zA-Z0-9#,.()\s%]/g, '') ?? '#000000'
    return (
        <BrandingContext.Provider value={value}>
            {/* Inject dynamic CSS variables for primaryColor */}
            <style>{`
                :root {
                    --color-primary: ${safePrimaryColor};
                    --color-primary-hover: ${safePrimaryColor}CC;
                }
            `}</style>
            {children}
        </BrandingContext.Provider>
    )
}

export function useBranding() {
    return useContext(BrandingContext)
}
