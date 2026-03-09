import { Exo } from 'next/font/google'
import "./globals.css"
import { ToastNotification } from '@/components/ui/ToastNotification'
import { BrandingProvider } from '@/context/BrandingContext'
import { BrandingData, getSettings } from '@/app/admin/settings/actions'

const exo = Exo({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-exo'
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let branding: BrandingData = {
    logoUrl: '',
    siteName: 'SPCS Academy',
    primaryColor: '#00C402',
  }
  try {
    const settings = await getSettings()
    branding = settings.branding
  } catch { }

  return (
    <html lang="pt-br" className={exo.variable}>
      <body className="font-exo">
        <BrandingProvider value={branding}>
          <ToastNotification />
          {children}
        </BrandingProvider>
      </body>
    </html>
  )
}