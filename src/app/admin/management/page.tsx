import { getAdmins } from './actions'
import ManagementClient from './ManagementClient'
import { ShieldCheck } from 'lucide-react'

export default async function AdminManagementPage() {
    const admins = await getAdmins()

    return (
        <div className="flex flex-col gap-8 animate-in fadeIn duration-700 font-montserrat p-8 md:p-12">
            <header className="flex flex-col items-start text-left mb-12 relative z-10">
                <div className="flex items-center gap-6 mb-6">
                    <div className="w-16 h-16 bg-[#1D5F31] flex items-center justify-center rounded-xl shadow-xl shadow-[#1D5F31]/20">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-tight !text-[#000000]">
                            Gestão de <span className="text-[#1D5F31]">Administradores</span>
                        </h1>
                        <p className="text-[10px] font-bold !text-black uppercase tracking-[0.4em] mt-1">
                            Nível de Acesso: Segurança Máxima
                        </p>
                    </div>
                </div>
            </header>

            <ManagementClient initialAdmins={admins} />
        </div>
    )
}
