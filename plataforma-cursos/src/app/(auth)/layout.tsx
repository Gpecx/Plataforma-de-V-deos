export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Trocamos bg-brand-dark pelo fundo fosco suave #F4F7F9
    <div className="min-h-screen bg-[#F4F7F9] flex items-center justify-center font-exo">
      {/* Trocamos shadow-2xl por shadow-sm e adicionamos borda fina para ficar clean */}
      <div className="w-full max-w-xl p-10 md:p-16 bg-white rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
        {/* Aditivos decorativos sutis */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00C402]/5 blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 w-full">
          {children}
        </div>
      </div>
    </div>
  )
}