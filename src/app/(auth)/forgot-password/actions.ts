'use server'

export async function resetPasswordAction(email: string) {
    if (!email || !email.includes('@')) {
        return { success: false, error: 'E-mail inválido' }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY

    if (!projectId || !apiKey) {
        console.error('Missing Firebase config')
        return { success: false, error: 'Erro de configuração do servidor' }
    }

    try {
        const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestType: 'PASSWORD_RESET',
                    email: email,
                }),
            }
        )

        const data = await response.json()

        if (!response.ok) {
            console.error('Firebase API error:', data)
            if (data.error?.message === 'EMAIL_NOT_FOUND') {
                return { success: false, error: 'E-mail não encontrado' }
            }
            if (data.error?.message === 'INVALID_EMAIL') {
                return { success: false, error: 'E-mail inválido' }
            }
            return { success: false, error: 'Erro ao enviar e-mail de recuperação' }
        }

        return { success: true }
    } catch (error) {
        console.error('resetPasswordAction error:', error)
        return { success: false, error: 'Erro interno do servidor' }
    }
}