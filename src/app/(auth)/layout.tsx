import { AuthProvider } from '@/context/AuthProvider'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-transparent font-montserrat">
      <AuthProvider>
        {children}
      </AuthProvider>
    </div>
  )
}