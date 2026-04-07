"use client"

import { PlayCircle } from "lucide-react"
import { useState } from "react"

interface CourseIntroPlayerProps {
    videoUrl: string
    thumbnail: string
}

export function CourseIntroPlayer({ videoUrl, thumbnail }: CourseIntroPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)

    if (!videoUrl) {
        return (
            <div className="relative aspect-video w-full bg-black overflow-hidden shadow-2xl group border-b border-white/10">
                <img
                    src={thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                    className="w-full h-full object-cover opacity-60 brightness-50"
                    alt="Course Preview"
                />
                <div className="absolute bottom-8 left-8 flex items-center gap-3">
                    <div className="p-2 bg-black/50 border border-[#00FF00] text-white rounded-full">
                        <PlayCircle size={20} />
                    </div>
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Aprenda com quem faz na prática</span>
                </div>
            </div>
        )
    }

    // Lógica para detectar e formatar URLs de embed
    const getEmbedUrl = (url: string) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.includes('v=')
                ? url.split('v=')[1].split('&')[0]
                : url.split('/').pop()?.split('?')[0]
            // rel=0: Sem vídeos relacionados de outros canais
            // modestbranding=1: Menos logos do YouTube
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`
        }

        if (url.includes('vimeo.com')) {
            const videoId = url.split('/').pop()?.split('?')[0]
            return `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`
        }

        return url // Retorna original para <video>
    }

    const isExternal = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('vimeo.com')

    if (!isPlaying) {
        return (
            <div
                onClick={() => setIsPlaying(true)}
                className="relative aspect-video w-full bg-black overflow-hidden shadow-2xl group border-b border-white/10 cursor-pointer"
            >
                <img
                    src={thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070"}
                    className="w-full h-full object-cover opacity-60 brightness-50 group-hover:scale-105 transition-transform duration-1000"
                    alt="Course Preview"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-black/50 border border-[#00FF00] text-[#00FF00] flex items-center justify-center shadow-[0_0_30px_rgba(0,255,0,0.2)] group-hover:scale-110 transition-transform rounded-full">
                        <PlayCircle size={48} />
                    </div>
                </div>
                <div className="absolute bottom-8 left-8 flex items-center gap-3">
                    <div className="p-2 bg-black/50 border border-[#00FF00] text-white rounded-full">
                        <PlayCircle size={20} />
                    </div>
                    <span className="text-white text-xs font-bold uppercase tracking-widest text-[#00FF00]">Assistir Apresentação</span>
                </div>
            </div>
        )
    }

    return (
        <div className="relative aspect-video w-full bg-black overflow-hidden shadow-2xl border-b border-white/10">
            {isExternal ? (
                <iframe
                    src={getEmbedUrl(videoUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            ) : (
                <video
                    src={videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full"
                    controlsList="nodownload"
                />
            )}
            <button
                onClick={() => setIsPlaying(false)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black p-2 text-white transition-colors border border-white/10"
                title="Fechar Vídeo"
            >
                <PlayCircle size={16} className="rotate-180" />
            </button>
        </div>
    )
}
