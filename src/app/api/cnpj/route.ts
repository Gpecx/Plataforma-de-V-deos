import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";

const BRASIL_API_URL = "https://brasilapi.com.br/api/cnpj/v1";
const RECEITAWS_URL = "https://receitaws.com.br/v1/cnpj";

interface CnpjResponse {
    success: boolean
    data?: {
        razao_social: string
        cep?: string
        logradouro?: string
        numero?: string
        complemento?: string
        bairro?: string
        municipio?: string
        uf?: string
    }
    error?: string
}

async function fetchBrasilApi(cnpj: string): Promise<CnpjResponse> {
    const res = await fetch(`${BRASIL_API_URL}/${cnpj}`, {
        next: { revalidate: 3600 },
    })

    if (!res.ok) {
        if (res.status === 404) {
            return { success: false, error: "CNPJ não encontrado na BrasilAPI" }
        }
        throw new Error(`BrasilAPI status ${res.status}`)
    }

    const data = await res.json()

    return {
        success: true,
        data: {
            razao_social: data.razao_social || data.nome_fantasia || "",
            cep: data.cep || undefined,
            logradouro: data.logradouro || undefined,
            numero: data.numero || undefined,
            complemento: data.complemento || undefined,
            bairro: data.bairro || undefined,
            municipio: data.municipio || undefined,
            uf: data.uf || undefined,
        },
    }
}

async function fetchReceitaWs(cnpj: string): Promise<CnpjResponse> {
    const res = await fetch(`${RECEITAWS_URL}/${cnpj}`, {
        next: { revalidate: 3600 },
    })

    if (!res.ok) {
        if (res.status === 404) {
            return { success: false, error: "CNPJ não encontrado na ReceitaWS" }
        }
        throw new Error(`ReceitaWS status ${res.status}`)
    }

    const data = await res.json()

    if (data.status === "ERROR") {
        return { success: false, error: data.message || "Erro na ReceitaWS" }
    }

    return {
        success: true,
        data: {
            razao_social: data.nome || data.fantasia || "",
            cep: data.cep || undefined,
            logradouro: data.logradouro || data.tipo_logradouro ? `${data.tipo_logradouro || ""} ${data.logradouro || ""}`.trim() : undefined,
            numero: data.numero || undefined,
            complemento: data.complemento || undefined,
            bairro: data.bairro || undefined,
            municipio: data.municipio || undefined,
            uf: data.uf || undefined,
        },
    }
}

async function getAuthUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token) return null

    try {
        return await adminAuth.verifySessionCookie(token, true)
    } catch (error) {
        return null
    }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const user = await getAuthUser()

        if (!user) {
            return new NextResponse(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401 }
            )
        }

        const cnpj = request.nextUrl.searchParams.get("cnpj") || ""

        const cleanCnpj = cnpj.toUpperCase().replace(/[^A-Z0-9]/g, "")

        if (cleanCnpj.length !== 14) {
            return NextResponse.json(
                { success: false, error: "CNPJ deve conter 14 dígitos" },
                { status: 400 }
            )
        }

        let result = await fetchBrasilApi(cleanCnpj)

        if (!result.success) {
            result = await fetchReceitaWs(cleanCnpj)
        }

        return NextResponse.json(result, { status: result.success ? 200 : 404 })
    } catch (error) {
        try {
            const cnpj = request.nextUrl.searchParams.get("cnpj") || ""
            const cleanCnpj = cnpj.toUpperCase().replace(/[^A-Z0-9]/g, "")
            const fallback = await fetchReceitaWs(cleanCnpj)
            return NextResponse.json(fallback, { status: fallback.success ? 200 : 404 })
        } catch (fallbackError) {
            return NextResponse.json(
                { success: false, error: "Indisponível no momento. Preencha manualmente." },
                { status: 503 }
            )
        }
    }
}
