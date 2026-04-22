import { Mux } from '@mux/mux-node'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Carrega variáveis de ambiente do .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

function sanitizeKey(key: string | undefined): string {
    if (!key) return ''
    return key.replace(/\\/g, '').trim()
}

async function testMuxConnection() {
    console.log('--- MUX CONNECTION TEST (INDUSTRIAL) ---')
    
    const tokenIdRaw = process.env.MUX_TOKEN_ID
    const tokenSecretRaw = process.env.MUX_TOKEN_SECRET
    
    const tokenId = sanitizeKey(tokenIdRaw)
    const tokenSecret = sanitizeKey(tokenSecretRaw)

    console.log('Token ID (Raw length):', tokenIdRaw?.length || 0)
    console.log('Token ID (Sanitized length):', tokenId.length)
    
    if (tokenIdRaw !== tokenId) {
        console.warn('⚠️ Sanitização detectou e removeu caracteres corrompidos no Token ID!')
    }

    if (!tokenId || !tokenSecret) {
        console.error('❌ MUX_TOKEN_ID ou MUX_TOKEN_SECRET não encontrados no .env.local')
        return
    }

    try {
        const mux = new Mux({ tokenId, tokenSecret })
        
        console.log('Tentando listar assets para validar autenticação...')
        
        // Chamada simples para testar credenciais
        const assets = await mux.video.assets.list({ limit: 1 })
        
        console.log('✅ Conexão bem-sucedida! Mux respondeu corretamente.')
        console.log('Total de assets (limit 1):', assets.data.length)

    } catch (error: any) {
        console.error('❌ ERRO NA CONEXÃO MUX:')
        
        if (error.status === 401) {
            console.error('Causa: ERRO DE AUTENTICAÇÃO (401). As chaves ainda estão inválidas.')
        } else if (error.status === 403) {
            console.error('Causa: PERMISSÃO NEGADA (403). O token não tem permissão para esta operação.')
        } else {
            console.error('Causa:', error.message || 'Erro desconhecido')
            console.error('Status Code:', error.status)
        }
        
        console.error('Dica Industrial: Verifique se há espaços invisíveis ou aspas duplas no seu arquivo .env ou Secret Manager.')
    }
}

testMuxConnection()
