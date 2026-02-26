import { Exo } from 'next/font/google'
import "./globals.css"

const exo = Exo({
  subsets: ['latin'],
  variable: '--font-exo' // Isso nos permite usar font-exo no Tailwind
})


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" className={exo.variable}>
      <body className="font-exo">
        {children}
      </body>
    </html>
  )
}