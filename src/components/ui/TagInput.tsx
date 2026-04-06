"use client"

import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface TagInputProps {
    tags: string[]
    onChange: (tags: string[]) => void
    maxTags?: number
    placeholder?: string
}

export default function TagInput({ tags, onChange, maxTags = 5, placeholder = "Digite e pressione Enter" }: TagInputProps) {
    const [inputValue, setInputValue] = useState('')

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag()
        } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
            removeTag(tags.length - 1)
        }
    }

    const addTag = () => {
        const trimmedTag = inputValue.trim()
        
        if (!trimmedTag) return
        
        if (tags.length >= maxTags) {
            alert(`Máximo de ${maxTags} tags permitido`)
            return
        }

        if (tags.some(tag => tag.toLowerCase() === trimmedTag.toLowerCase())) {
            alert('Tag já existente')
            return
        }

        onChange([...tags, trimmedTag])
        setInputValue('')
    }

    const removeTag = (index: number) => {
        onChange(tags.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border-2 border-black rounded-none bg-white">
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1D5F31] text-white text-[10px] font-black uppercase tracking-widest rounded-none"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="hover:text-red-300 transition-colors ml-1"
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}
            </div>
            <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder={tags.length >= maxTags ? "Limite atingido" : placeholder}
                disabled={tags.length >= maxTags}
                className="bg-white border-2 border-black focus:border-black focus:ring-black h-12 rounded-none text-sm font-medium transition-all text-black placeholder:text-black/50"
            />
            <p className="text-[9px] text-black/60 font-black uppercase tracking-widest">
                {tags.length}/{maxTags} tags • Pressione Enter ou vírgula para adicionar
            </p>
        </div>
    )
}