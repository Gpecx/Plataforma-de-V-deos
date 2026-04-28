import { getLegalDocsSettings, getLegalDocuments, saveLegalDocsSettings, getLegalDocsDefaults } from "./actions"
import LegalDocsManagerClient from "./LegalDocsManagerClient"

export const dynamic = "force-dynamic"

export default async function LegalAdminPage() {
    let settings = await getLegalDocsSettings()
    const defaults = await getLegalDocsDefaults()

    console.log("[LegalAdminPage] Settings atuais:", {
        hasTerms: !!settings?.terms,
        hasPrivacy: !!settings?.privacy,
        termsLength: settings?.terms?.length
    })

    // Lógica de recuperação mais agressiva
    const isBlank = (val: string | undefined) => !val || val.trim().length === 0 || val.includes('Conteúdo em breve')
    
    const needsTerms = isBlank(settings.terms)
    const needsPrivacy = isBlank(settings.privacy)
    const needsRefund = isBlank(settings.refund)
    const needsLgpd = isBlank(settings.lgpd)

    if (needsTerms || needsPrivacy || needsRefund || needsLgpd) {
        console.log("[LegalAdminPage] Documentos incompletos detectados. Iniciando recuperação...")
        const oldDocs = await getLegalDocuments()
        console.log("[LegalAdminPage] Documentos antigos encontrados:", oldDocs.length)
        
        const updatedSettings = {
            terms: isBlank(settings.terms) ? (oldDocs.find(d => d.slug === 'terms-of-use')?.content || defaults.terms) : settings.terms!,
            privacy: isBlank(settings.privacy) ? (oldDocs.find(d => d.slug === 'privacy-policy')?.content || defaults.privacy) : settings.privacy!,
            refund: isBlank(settings.refund) ? (oldDocs.find(d => d.slug === 'refund-policy')?.content || defaults.refund) : settings.refund!,
            lgpd: isBlank(settings.lgpd) ? (oldDocs.find(d => d.slug === 'lgpd')?.content || defaults.lgpd) : settings.lgpd!
        }

        // Salva apenas se houve mudança real
        const hasChanges = updatedSettings.terms !== settings.terms || 
                          updatedSettings.privacy !== settings.privacy || 
                          updatedSettings.refund !== settings.refund || 
                          updatedSettings.lgpd !== settings.lgpd

        if (hasChanges) {
            console.log("[LegalAdminPage] Salvando novos dados recuperados...")
            await saveLegalDocsSettings(updatedSettings, false)
            settings = updatedSettings
        }
    }

    return <LegalDocsManagerClient initialData={settings} />
}
