import { Exo } from 'next/font/google'
import "./globals.css"
import { ToastNotification } from '@/components/ui/ToastNotification'

const exo = Exo({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
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
        <ToastNotification />
        {children}
      </body>
    </html>
  )
}