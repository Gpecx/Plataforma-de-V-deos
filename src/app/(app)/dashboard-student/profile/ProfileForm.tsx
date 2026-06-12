'use client'

import { useActionState, useState, useRef, ChangeEvent } from 'react'
import { updateProfile } from '../actions'
import { User, Save, CheckCircle2, AlertCircle, Camera, Loader2, Trash2 } from 'lucide-react'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

interface ProfileFormProps {
    initialFullName: string
    initialPhotoURL: string
    uid: string
}

const initialState = {
    success: false,
    error: undefined as string | undefined
}

export function ProfileForm({ initialFullName, initialPhotoURL, uid }: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState(updateProfile, initialState)
    const [photoURL, setPhotoURL] = useState(initialPhotoURL)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Função para extrair as iniciais do nome
    const getInitials = (name: string) => {
        if (!name) return '??'
        const names = name.trim().split(' ')
        if (names.length === 1) return names[0].substring(0, 2).toUpperCase()
        return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }

    // Redimensionar imagem usando Canvas
    const resizeImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_SIZE = 400
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width
                            width = MAX_SIZE
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height
                            height = MAX_SIZE
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)

                    canvas.toBlob(
                        (blob) => {
                            if (blob) resolve(blob)
                            else reject(new Error('Canvas to Blob failed'))
                        },
                        'image/jpeg',
                        0.85
                    )
                }
            }
            reader.onerror = (err) => reject(err)
        })
    }

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        setUploadError(null)

        try {
            // 1. Redimensionar
            const resizedBlob = await resizeImage(file)
            
            // 2. Upload para Firebase Storage
            const storageRef = ref(storage, `user_avatars/${uid}/avatar.jpg`)
            const uploadResult = await uploadBytes(storageRef, resizedBlob)
            
            // 3. Obter URL pública
            const downloadURL = await getDownloadURL(uploadResult.ref)
            
            setPhotoURL(downloadURL)
        } catch (error) {
            console.error('Erro no upload:', error)
            setUploadError('Erro ao processar imagem. Tente novamente.')
        } finally {
            setIsUploading(false)
        }
    }

    const removePhoto = () => {
        setPhotoURL('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <form action={formAction} className="space-y-10">
            {/* Campo oculto para persistir a URL da foto via Server Action */}
            <input type="hidden" name="photoURL" value={photoURL} />

            <div className="space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                    <div className="relative group/avatar">
                        <div 
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                            className="w-28 h-28 bg-white border border-black rounded-xl flex items-center justify-center text-[#1a1a1a] shadow-sm relative overflow-hidden cursor-pointer transition-all active:scale-95 group-hover/avatar:border-[#1D5F31]"
                        >
                            {isUploading ? (
                                <Loader2 size={32} className="animate-spin text-slate-400" />
                            ) : photoURL ? (
                                <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-bold tracking-tight select-none">
                                    {getInitials(initialFullName)}
                                </span>
                            )}

                            {/* Overlay de Upload */}
                            {!isUploading && (
                                <div className="absolute inset-0 bg-[#F5F5F7]/80 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300">
                                    <Camera size={24} className="text-[#1a1a1a] mb-1" />
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-[#1a1a1a]">Alterar</span>
                                </div>
                            )}
                        </div>

                        {photoURL && !isUploading && (
                            <button
                                type="button"
                                onClick={removePhoto}
                                className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full border-2 border-white shadow-lg hover:bg-red-700 transition-colors z-10"
                                title="Remover foto"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}

                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    
                    <div className="text-center md:text-left">
                        <h2 className="text-xl font-bold tracking-tighter uppercase text-[#1a1a1a] leading-tight">Informações Básicas</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[2px] mt-1">Como você aparece para os instrutores e colegas.</p>
                        {uploadError && (
                            <p className="text-[9px] text-red-600 font-bold uppercase tracking-widest mt-2">{uploadError}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 max-w-2xl">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            defaultValue={initialFullName}
                            className="w-full bg-gray-50 border border-black shadow-sm rounded-xl px-5 py-4 focus:outline-none focus:border-[#1D5F31] focus:bg-white transition-all text-[#1a1a1a] font-medium placeholder-slate-400"
                            placeholder="Seu nome"
                            required
                        />
                    </div>
                </div>

                {state?.success && (
                    <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200/40 rounded-xl text-green-700 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 size={16} />
                        Perfil atualizado com sucesso!
                    </div>
                )}

                {state?.error && (
                    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200/40 rounded-xl text-red-700 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={16} />
                        {state.error}
                    </div>
                )}
            </div>

            <div className="pt-8 border-t border-slate-100">
                <button
                    type="submit"
                    disabled={isPending || isUploading}
                    className="flex items-center justify-center gap-3 w-full md:w-auto px-12 h-14 bg-[#1D5F31] border border-black text-white font-bold uppercase tracking-[2px] rounded-xl hover:bg-[#154724] transition-all active:scale-[0.98] disabled:opacity-50 group"
                >
                    {(isPending || isUploading) ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Save size={20} className="group-hover:scale-110 transition-transform" />
                    )}
                    {isPending ? 'Salvando...' : isUploading ? 'Fazendo Upload...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    )
}
