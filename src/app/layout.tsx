import { Exo } from 'next/font/google'
import "./globals.css"
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthProvider'

const exo = Exo({
  subsets: ['latin'],
  variable: '--font-exo'
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" className={exo.variable}>
      <body className="font-exo">
        <Toaster position="top-right" richColors closeButton />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}