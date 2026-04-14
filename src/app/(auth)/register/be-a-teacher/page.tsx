'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
}

const QUESTIONS = [
    {
        id: "intro",
        type: "info",
        question: "Bem-vindo ao processo de seleção de instrutores PowerPlay!",
        subtext: "Complete estas breves perguntas para avaliarmos seu perfil e te dar o próximo passo."
    },
    {
        id: "primary_topic",
        type: "select",
        question: "Sobre qual tópico principal você pretende ensinar?",
        options: ["Programação", "Negócios", "Design", "Marketing", "Desenvolvimento Pessoal"]
    },
    {
        id: "experience_level",
        type: "radio",
        question: "Qual seu nível de experiência com o tópico escolhido?",
        options: ["Iniciante (menos de 1 ano)", "Intermediário (1-3 anos)", "Avançado (4-6 anos)", "Especialista (7+ anos)"]
    },
    {
        id: "hardware_check",
        type: "radio",
        question: "Você possui equipamento adequado para gravações (Câmera 1080p e Microfone sem ruídos)?",
        options: ["Sim, possuo equipamento profissional", "Possuo equipamento básico e pretendo melhorar", "Ainda não possuo, preciso de orientações"]
    },
    {
        id: "qualification_summary",
        type: "textarea",
        question: "Resuma sua qualificação e experiências mais relevantes para este tópico.",
        subtext: "Por que você é a pessoa ideal para ensinar este curso?",
        placeholder: "Ex: Certificação XYZ, 5 anos como Lead Developer na Empresa ABC..."
    },
    {
        id: "final_check",
        type: "final_info",
        question: "Tudo pronto!",
        subtext: "Ao clicar em Enviar, sua aplicação será anexada ao seu cadastro e avaliada pela nossa equipe. Responderemos em breve na plataforma."
    }
]

export default function BeATeacherPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})

    const question = QUESTIONS[currentStep]

    const handleNext = () => {
        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const handleFinish = () => {
        console.log('Teacher Application Data:', answers)
        localStorage.setItem('powerplay_teacher_quiz', JSON.stringify(answers))
        router.push('/register?type=teacher' as any)
    }

    const handleChange = (val: string) => {
        setAnswers(prev => ({ ...prev, [question.id]: val }))
    }

    const canProceed = () => {
        if (question.type === 'info' || question.type === 'final_info') return true
        if (question.type === 'textarea') {
            return (answers[question.id] || '').length >= 10
        }
        return !!answers[question.id]
    }

    const inputClass = "w-full p-4 bg-white/5 text-white border border-white/10 shadow-sm transition-all outline-none text-sm font-medium placeholder:text-white/30 focus:border-[#28b828] focus:bg-white/10 rounded-xl relative overflow-hidden"
    const radioClass = (selected: boolean) => `w-full p-4 text-left border shadow-sm transition-all outline-none text-sm font-medium rounded-xl mb-3 flex items-center gap-3 cursor-pointer ${selected ? 'bg-[#1D5F31] border-[#28b828] text-white' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'}`

    return (
        <div className="min-h-screen w-full flex flex-row bg-[var(--background-color)] overflow-hidden font-montserrat">
            <div className="hidden md:flex md:w-1/2 bg-[var(--background-color)] items-center justify-center p-0 overflow-hidden border-r border-white/5">
                <div className="w-full h-full relative">
                    <img
                        src="/register-illustration.png"
                        alt="PowerPlay"
                        className="w-full h-full object-cover object-center brightness-110 saturate-[0.9]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--background-color)]/80" />
                </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col items-center justify-start pt-8 md:pt-12 lg:pt-16 p-6 md:p-12 bg-[var(--background-color)] relative overflow-y-auto custom-scrollbar">
                <div className="w-full max-w-[550px] flex flex-col pt-10">
                    <div className="flex justify-center mb-8">
                        <Logo variant="vertical" className="scale-110" />
                    </div>
                    
                    <div className="w-full bg-white/10 h-1 rounded-full mb-10 overflow-hidden">
                        <div 
                            className="bg-[#28b828] h-full transition-all duration-300 ease-out"
                            style={{ width: `${((currentStep) / (QUESTIONS.length - 1)) * 100}%` }}
                        />
                    </div>

                    <div className="relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={fadeUp}
                                className="w-full"
                            >
                                <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter text-white mb-2 leading-tight">
                                    {question.question}
                                </h3>
                                {question.subtext && (
                                    <p className="text-sm font-medium text-white/50 mb-8">{question.subtext}</p>
                                )}

                                <div className="mt-8">
                                    {question.type === 'select' && question.options && (
                                        <select 
                                            className={`${inputClass} appearance-none cursor-pointer`}
                                            value={answers[question.id] || ''}
                                            onChange={(e) => handleChange(e.target.value)}
                                        >
                                            <option value="" disabled>Selecione uma opção</option>
                                            {question.options.map((opt: string) => (
                                                <option key={opt} value={opt} className="bg-[#101119]">{opt}</option>
                                            ))}
                                        </select>
                                    )}

                                    {question.type === 'radio' && question.options && (
                                        <div className="space-y-2">
                                            {question.options.map((opt: string) => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => handleChange(opt)}
                                                    className={radioClass(answers[question.id] === opt)}
                                                >
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${answers[question.id] === opt ? 'border-white' : 'border-white/50'}`}>
                                                        {answers[question.id] === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                                                    </div>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {question.type === 'textarea' && (
                                        <textarea
                                            rows={5}
                                            className={`${inputClass} resize-none`}
                                            placeholder={question.placeholder}
                                            value={answers[question.id] || ''}
                                            onChange={(e) => handleChange(e.target.value)}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-between items-center mt-8 pb-10 pt-6">
                        <button
                            onClick={handlePrev}
                            disabled={currentStep === 0}
                            className="flex items-center gap-2 text-white/50 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Anterior
                        </button>

                        {currentStep < QUESTIONS.length - 1 ? (
                            <button
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className="group relative overflow-hidden bg-gradient-to-r from-[#1D5F31] via-[#28b828] to-[#1D5F31] hover:from-[#28b828] hover:via-[#34d834] hover:to-[#28b828] text-white font-bold uppercase tracking-[2px] px-8 py-3 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-xl active:scale-[0.98] shadow-[0_0_15px_rgba(40,184,40,0.3)] hover:shadow-[0_0_25px_rgba(40,184,40,0.5)] flex items-center gap-2 text-xs"
                            >
                                <span className="relative z-10">PRÓXIMO</span>
                                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinish}
                                className="group relative overflow-hidden bg-gradient-to-r from-[#1D5F31] via-[#28b828] to-[#1D5F31] hover:from-[#28b828] hover:via-[#34d834] hover:to-[#28b828] text-white font-bold uppercase tracking-[2px] px-8 py-3 transition-all rounded-xl active:scale-[0.98] shadow-[0_0_20px_rgba(40,184,40,0.4)] hover:shadow-[0_0_30px_rgba(40,184,40,0.6)] flex items-center gap-2 text-xs"
                            >
                                <span className="relative z-10">ENVIAR CANDIDATURA</span>
                                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
