"use client";

import { useEffect, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { useAuth } from "@/context/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface SecureMuxPlayerProps {
  cursoId: string;
  playbackId: string;
  className?: string; // Optional for external styling
}

export default function SecureMuxPlayer({
  cursoId,
  playbackId,
  className = "",
}: SecureMuxPlayerProps) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlaybackToken() {
      if (!user) {
        if (isMounted) setError("Usuário não autenticado.");
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/videos/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ cursoId, playbackId }),
        });

        if (!response.ok) {
          if (response.status === 403 || response.status === 401) {
             throw new Error("Você não tem acesso a este conteúdo.");
          }
          throw new Error("Erro ao carregar o vídeo.");
        }

        const data = await response.json();
        if (isMounted && data.token) {
          setToken(data.token);
        } else if (isMounted) {
            throw new Error("Token não recebido da API.");
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Ocorreu um erro desconhecido.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPlaybackToken();

    return () => {
      isMounted = false;
    };
  }, [user, cursoId, playbackId]);

  if (loading) {
    return (
      <div className={`relative w-full aspect-video rounded-md overflow-hidden bg-slate-900 ${className}`}>
        <Skeleton className="w-full h-full opacity-20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-[#1D5F31] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-bold uppercase tracking-[4px] text-white/40">Sincronizando Player...</span>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className={`relative w-full aspect-video rounded-md overflow-hidden bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 p-6 text-center ${className}`}>
        <AlertCircle className="w-10 h-10 mb-4 text-red-500/80" />
        <p className="text-xs md:text-sm font-bold uppercase tracking-[2px]">{error || "Não foi possível autenticar o acesso ao vídeo."}</p>
        <p className="text-[10px] mt-2 opacity-50 uppercase tracking-widest ">Erro de Autenticação Industrial</p>
      </div>
    );
  }

  return (
    <div 
        className={`relative w-full aspect-video rounded-md overflow-hidden bg-black shadow-2xl border border-white/5 ${className}`}
        onContextMenu={(e) => e.preventDefault()}
    >
      <MuxPlayer
        playbackId={playbackId}
        tokens={{ playback: token }}
        metadata={{
          video_id: playbackId,
          video_title: `Curso ID: ${cursoId}`,
          viewer_id: user?.uid,
        }}
        primaryColor="#1D5F31"
        nohotkeys
        className="w-full h-full object-contain"
      />
    </div>
  );
}
