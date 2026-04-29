"use client"

import dynamic from 'next/dynamic'
import { useState, useEffect, useMemo, useRef } from 'react'
import 'react-quill-new/dist/quill.snow.css'

// Import dinâmico com loading state aprimorado
const ReactQuill = dynamic(() => import('react-quill-new'), { 
    ssr: false,
    loading: () => (
        <div className="h-[400px] w-full bg-[#FAFAFA] flex items-center justify-center border border-black/10">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-black/10 border-t-[#1D5F31] animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-[2px] text-slate-400">Carregando Editor...</span>
            </div>
        </div>
    )
})

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const [localValue, setLocalValue] = useState(value)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isFirstRender = useRef(true)

    // Sincroniza apenas se o valor externo mudar drasticamente (ex: Reset)
    useEffect(() => {
        if (value !== localValue) {
            setLocalValue(value)
        }
    }, [value])

    // Debounce para evitar sobrecarga no estado pai
    const handleLocalChange = (content: string) => {
        setLocalValue(content)
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        
        timeoutRef.current = setTimeout(() => {
            onChange(content)
        }, 500)
    }

    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold'], // Italic removido para manter padrão "texto reto" Industrial
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    }), [])

    const formats = [
        'header',
        'bold',
        'list', 'bullet',
        'link'
    ]

    return (
        <div className="rich-text-editor-container border border-black rounded-none overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] focus-within:shadow-[4px_4px_0px_0px_rgba(29,95,49,0.2)] transition-all">
            <ReactQuill 
                theme="snow"
                value={localValue}
                onChange={handleLocalChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="bg-white text-slate-900"
            />
            
            <style dangerouslySetInnerHTML={{ __html: `
                .rich-text-editor-container .ql-toolbar {
                    border: none !important;
                    border-bottom: 1px solid black !important;
                    background: #F8FAFC !important;
                    border-radius: 0 !important;
                    padding: 12px !important;
                }
                .rich-text-editor-container .ql-container {
                    border: none !important;
                    font-family: 'Inter', sans-serif !important;
                    font-size: 14px !important;
                    min-height: 400px;
                }
                .rich-text-editor-container .ql-editor {
                    min-height: 400px;
                    font-style: normal !important;
                    padding: 32px !important;
                }
                .rich-text-editor-container .ql-editor * {
                    font-style: normal !important;
                }
                
                .ql-italic { display: none !important; }

                .rich-text-editor-container .ql-editor.ql-blank::before {
                    color: #94a3b8 !important;
                    font-style: normal !important;
                    left: 32px !important;
                }

                /* Estilização Industrial dos elementos internos */
                .rich-text-editor-container .ql-editor h1 {
                    font-size: 2.25rem !important;
                    font-weight: 900 !important;
                    text-transform: uppercase !important;
                    margin-bottom: 1.5rem !important;
                    color: black !important;
                    border-left: 8px solid #1D5F31;
                    padding-left: 20px;
                    line-height: 1 !important;
                    letter-spacing: -0.04em;
                }
                .rich-text-editor-container .ql-editor h2 {
                    font-size: 1.5rem !important;
                    font-weight: 800 !important;
                    margin-top: 2.5rem !important;
                    margin-bottom: 1.25rem !important;
                    color: #1D5F31 !important;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .rich-text-editor-container .ql-editor h3 {
                    font-size: 1.1rem !important;
                    font-weight: 800 !important;
                    margin-top: 2rem !important;
                    margin-bottom: 0.75rem !important;
                    color: black !important;
                    text-transform: uppercase;
                }
                .rich-text-editor-container .ql-editor p {
                    margin-bottom: 1.5rem !important;
                    line-height: 1.8 !important;
                    color: #334155 !important;
                    font-size: 16px;
                }
                .rich-text-editor-container .ql-editor b, 
                .rich-text-editor-container .ql-editor strong {
                    font-weight: 800 !important;
                    color: #0f172a;
                }
                .rich-text-editor-container .ql-editor ul, 
                .rich-text-editor-container .ql-editor ol {
                    padding-left: 2rem !important;
                    margin-bottom: 2rem !important;
                }
                .rich-text-editor-container .ql-editor li {
                    margin-bottom: 1rem !important;
                    color: #334155;
                }
                .rich-text-editor-container .ql-editor a {
                    color: #1D5F31 !important;
                    text-decoration: underline !important;
                    font-weight: 700;
                }
            ` }} />
        </div>
    )
}
