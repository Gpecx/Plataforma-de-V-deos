"use client"

import { useEffect, useState } from 'react'

interface VideoWatermarkProps {
  userEmail: string | null | undefined
  userId: string | null | undefined
}

export function VideoWatermark({ userEmail, userId }: VideoWatermarkProps) {
  const [pos, setPos] = useState({ x: 10, y: 10 })
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Mantém entre 10% e 80% para evitar que corte nas bordas
    const randomPos = () => ({
      x: Math.floor(Math.random() * 70) + 10,
      y: Math.floor(Math.random() * 70) + 10,
    })

    // Posição inicial
    setPos(randomPos())

    const interval = setInterval(() => {
      // Começa o fade-out
      setIsVisible(false)

      // Aguarda 500ms (tempo da transição) para mover e fazer fade-in novamente
      setTimeout(() => {
        setPos(randomPos())
        setIsVisible(true)
      }, 500)
      
    }, 20000) // 20 segundos

    return () => clearInterval(interval)
  }, [])

  if (!userEmail && !userId) return null

  const displayText = userEmail || userId || ''

  return (
    <div
      className={`absolute transition-opacity duration-500 ease-in-out select-none pointer-events-none z-10 ${
        isVisible ? 'opacity-30' : 'opacity-0'
      }`}
      style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
      aria-hidden="true"
    >
      <span className="text-xs font-mono font-bold text-slate-200 whitespace-nowrap tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
        {displayText}
      </span>
    </div>
  )
}
