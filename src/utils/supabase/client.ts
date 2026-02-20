import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log("--- TESTE DE CONEXÃO ---");
    console.log("URL encontrada:", supabaseUrl ? "SIM" : "NÃO (Vazia)");
    console.log("Chave encontrada:", supabaseKey ? "SIM" : "NÃO (Vazia)");

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("As variáveis de ambiente do Supabase não foram carregadas corretamente!");
    }

    return createBrowserClient(supabaseUrl, supabaseKey);
}