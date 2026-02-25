import { createClient } from './client'

/**
 * Faz o upload de uma imagem (ou vídeo) para o bucket 'course-images' no Supabase.
 * Gera um nome único e retorna o publicUrl.
 */
export async function uploadCourseImage(file: File): Promise<string> {
    const supabase = createClient()

    // Gera um nome único: timestamp + hash randomizado + extensão original
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = fileName // Salvando na raiz do bucket

    const { data, error } = await supabase.storage
        .from('course-images')
        .upload(filePath, file, {
            contentType: file.type, // Garante que o MIME type seja enviado corretamente
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        console.error('Erro no upload do Supabase:', error)
        throw new Error('Falha ao fazer o upload da imagem.')
    }

    // Pega a URL pública
    const { data: { publicUrl } } = supabase.storage
        .from('course-images')
        .getPublicUrl(filePath)

    return publicUrl
}

/**
 * Faz o upload de um vídeo para o bucket 'course-videos' no Supabase.
 * Valida o limite de 50MB do plano gratuito.
 */
export async function uploadCourseVideo(file: File): Promise<string> {
    const supabase = createClient()

    // 1. Validação de Tamanho (50MB = 52.428.800 bytes)
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
        throw new Error('O vídeo excede o limite de 50MB. Por favor, comprima o arquivo antes de subir.')
    }

    // 2. Gera um nome único
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = fileName

    const { data, error } = await supabase.storage
        .from('course-videos')
        .upload(filePath, file, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        console.error('Erro no upload de vídeo do Supabase:', error)
        throw new Error('Falha ao fazer o upload do vídeo.')
    }

    // 3. Pega a URL pública
    const { data: { publicUrl } } = supabase.storage
        .from('course-videos')
        .getPublicUrl(filePath)

    return publicUrl
}
