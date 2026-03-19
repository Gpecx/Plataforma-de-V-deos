'use client'

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
        backgroundColor: '#020617', // Slate 950 for deep dark feel
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        padding: '24px'
      }}>
        <div style={{
          padding: '48px',
          border: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(255,255,255,0.02)',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Mockup Logo PowerPlay */}
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#1D5F31',
            color: 'white',
            fontWeight: '900',
            fontSize: '12px',
            letterSpacing: '0.2em',
            marginBottom: '32px',
            textTransform: 'uppercase'
          }}>
            POWERPLAY
          </div>
          
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '800', 
            marginBottom: '12px',
            letterSpacing: '-0.02em',
            color: '#ffffff'
          }}>
            Tivemos um problema de conexão
          </h1>
          
          <p style={{ 
            color: '#94a3b8', 
            marginBottom: '40px', 
            fontSize: '16px',
            lineHeight: '1.6'
          }}>
            Não foi possível carregar a plataforma no momento. Pode ser uma instabilidade temporária no servidor.
          </p>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#1D5F31',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              transition: 'background-color 0.2s',
              width: '100%'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#28b828')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1D5F31')}
          >
            Recarregar Plataforma
          </button>
        </div>
      </body>
    </html>
  )
}
