"use client"

import { useEffect, useRef } from 'react'

interface Particle {
  baseX: number;
  baseY: number;
  offsetX: number;
  offsetY: number;
  offsetVx: number;
  offsetVy: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
}

export default function SpaceParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const rafId = useRef<number>(0)
  const mouse = useRef({ x: -1000, y: -1000, vx: 0, vy: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let w = window.innerWidth
    let h = window.innerHeight
    canvas.width = w
    canvas.height = h

    // Densidade muito baixa, igual à foto enviada (ex: ~100 estrelas em Full HD)
    const particleCount = Math.min(250, Math.floor((w * h) / 12000))
    
    particles.current = Array.from({ length: particleCount }, () => {
      const baseVx = (Math.random() - 0.5) * 0.3; // Movimento natural na tela
      const baseVy = (Math.random() - 0.5) * 0.3;
      return {
        baseX: Math.random() * w,
        baseY: Math.random() * h,
        offsetX: 0,
        offsetY: 0,
        offsetVx: 0,
        offsetVy: 0,
        vx: baseVx,
        vy: baseVy,
        size: Math.random() * 1.5 + 0.3, // Pontos pequenos e nítidos como na foto
        baseAlpha: Math.random() * 0.7 + 0.3, // Transparências variadas para profundidade
      };
    })

    const handleResize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w
      canvas.height = h
    }

    let lastMouse = { x: -1000, y: -1000 }
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.vx = e.clientX - lastMouse.x
      mouse.current.vy = e.clientY - lastMouse.y
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      lastMouse.x = e.clientX
      lastMouse.y = e.clientY
    }

    const handleMouseLeave = () => {
      mouse.current.x = -1000
      mouse.current.y = -1000
    }

    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    const draw = () => {
      ctx.clearRect(0, 0, w, h)

      // Mouse mantém um pouco de inércia para o cálculo de arrasto
      mouse.current.vx *= 0.85
      mouse.current.vy *= 0.85

      const interactionRadius = 150 // Área de repulsão menor para não varrer a tela
      const repulsionForce = 1.2 // Força de afastamento mais branda
      const springFactor = 0.04 // Força do "Ímã" que puxa de volta para a base (quanto maior, mais rígido)
      const dampening = 0.88 // Fricção elástica (abaixo de 1 para evitar oscilação infinita)

      for (let i = 0; i < particles.current.length; i++) {
        const p = particles.current[i]

        // 1. Movimento natural contínuo
        p.baseX += p.vx
        p.baseY += p.vy

        // Bordas contínuas (Wrap)
        if (p.baseX < 0) p.baseX = w
        if (p.baseX > w) p.baseX = 0
        if (p.baseY < 0) p.baseY = h
        if (p.baseY > h) p.baseY = 0

        // Posição atual real (base + offset elástico)
        let currentX = p.baseX + p.offsetX
        let currentY = p.baseY + p.offsetY

        // 2. Interação com o mouse (Repulsão + Arrasto leve)
        const dx = mouse.current.x - currentX
        const dy = mouse.current.y - currentY
        const distSq = dx * dx + dy * dy

        if (distSq < interactionRadius * interactionRadius) {
            const dist = Math.sqrt(distSq)
            const force = (interactionRadius - dist) / interactionRadius
            
            // Empurra a estrela na direção oposta ao mouse
            p.offsetVx -= (dx / dist) * force * repulsionForce
            p.offsetVy -= (dy / dist) * force * repulsionForce

            // Adiciona um pouco do vetor de velocidade do mouse
            p.offsetVx += mouse.current.vx * force * 0.05
            p.offsetVy += mouse.current.vy * force * 0.05
        }

        // 3. Efeito "Ímã" (Mola / Spring Physics)
        // Acelera na direção oposta ao offset (puxando de volta para o zero)
        p.offsetVx += (0 - p.offsetX) * springFactor
        p.offsetVy += (0 - p.offsetY) * springFactor

        // Aplica a fricção elástica
        p.offsetVx *= dampening
        p.offsetVy *= dampening

        // Atualiza a posição elástica com a nova velocidade
        p.offsetX += p.offsetVx
        p.offsetY += p.offsetVy

        currentX = p.baseX + p.offsetX
        currentY = p.baseY + p.offsetY

        // Desenho da estrela nítida
        ctx.beginPath()
        ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2)
        
        ctx.fillStyle = `rgba(255, 255, 255, ${p.baseAlpha})`
        ctx.fill()
      }

      rafId.current = requestAnimationFrame(draw)
    }

    rafId.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(rafId.current)
    }
  }, [])

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0, background: '#061629' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}
