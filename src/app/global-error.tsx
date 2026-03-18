'use client'

import { Lexend } from 'next/font/google'

const lexend = Lexend({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
})

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-br">
      <body style={{
        margin: 0,
        backgroundColor: '#061629',
        color: 'white',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{
          padding: '40px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '900', 
            color: '#1D5F31',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '-0.05em'
          }}>
            PowerPlay
          </h1>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Tivemos um problema de conexão</h2>
          <p style={{ opacity: 0.7, marginBottom: '24px', fontSize: '14px' }}>
            Não foi possível carregar a plataforma no momento. Por favor, tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#1D5F31',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Recarregar Plataforma
          </button>
        </div>
      </body>
    </html>
  )
}
