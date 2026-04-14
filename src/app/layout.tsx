import { Exo, Montserrat } from 'next/font/google'
import "./globals.css"
import { ToastNotification } from '@/components/ui/ToastNotification'
import { BrandingProvider } from '@/context/BrandingContext'
import { BrandingData, getSettings } from '@/app/admin/settings/actions'
import { CartStoreSynchronizer } from '@/components/CartStoreSynchronizer'

const exo = Exo({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-exo'
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '700', '800', '900'],
  variable: '--font-montserrat'
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let branding: BrandingData = {
    logoUrl: '',
    siteName: 'PowerPlay',
    primaryColor: '#1D5F31',
  }
  try {
    const settings = await getSettings()
    branding = settings.branding
  } catch { }

  return (
    <html lang="pt-br" className={`${exo.variable} ${montserrat.variable}`}>
      <body className="font-montserrat antialiased">
        <BrandingProvider value={branding}>
          <CartStoreSynchronizer />
          <ToastNotification />
          {children}
        </BrandingProvider>
      </body>
    </html>
  )
}