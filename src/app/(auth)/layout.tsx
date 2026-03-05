'use client'
import { usePathname } from 'next/navigation'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isRegister = pathname === '/register'

  // Definindo as imagens para cada rota
  const bgImage = isRegister
    ? "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=2000" // Imagem estilo escritório/tecnologia
    : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000" // Imagem original

  return (
    <div className="min-h-screen bg-white flex font-exo">
      {/* Esquerda: Banner Imagem (escondido no mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-end p-12 bg-black">
        <img
          src={bgImage}
          alt="Students learning"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <div className="relative z-10 w-full max-w-xl" style={{ color: 'white' }}>
          <div className="inline-flex py-1.5 px-3 rounded-full bg-white/10 backdrop-blur-md mb-6 border border-white/20 text-[10px] font-black uppercase tracking-widest !text-white drop-shadow-lg" style={{ color: 'white' }}>
            SPCS ACADEMY
          </div>
          <h1 className="text-4xl lg:text-5xl font-black mb-4 tracking-tighter leading-tight uppercase !text-white drop-shadow-lg" style={{ color: 'white' }}>
            Transforme o seu futuro profissional hoje.
          </h1>
          <p className="text-lg font-medium tracking-tight !text-white drop-shadow-lg" style={{ color: 'white' }}>
            Junte-se a milhares de estudantes e aprenda com especialistas de mercado.
          </p>
        </div>
      </div>

      {/* Direita: Conteúdo de Autenticação */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00C402]/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

        <div className="w-full max-w-md relative z-10">
          {children}
        </div>
      </div>
    </div>
  )
}