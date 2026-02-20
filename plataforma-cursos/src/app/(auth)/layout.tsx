export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center font-exo">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl">
        {/* Aqui entrará o formulário de Login ou Registro */}
        {children}
      </div>
    </div>
  )
}