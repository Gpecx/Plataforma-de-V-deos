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
  startTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
}

export default function SecureMuxPlayer({
  cursoId,
  playbackId,
  className = "",
  startTime = 0,
  onTimeUpdate,
  onEnded,
}: SecureMuxPlayerProps) {
  const { user, loading: authLoading } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlaybackToken() {
      try {
        if (authLoading) return;

        if (!playbackId) {
          if (isMounted) {
            setError("ID de reprodução não encontrado.");
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        let idToken = null;
        if (user) {
            idToken = await user.getIdToken().catch(err => {
                console.error("Erro ao obter idToken:", err);
                return null;
            });
        }

        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if (idToken) {
            headers["Authorization"] = `Bearer ${idToken}`;
        }
        
        console.log(`[SecureMuxPlayer] Solicitando token de vídeo para Curso: ${cursoId}, Playback: ${playbackId}`);
        const response = await fetch("/api/videos/auth", {
          method: "POST",
          headers,
          body: JSON.stringify({ cursoId, playbackId }),
        });

        if (!response.ok) {
          if (response.status === 403 || response.status === 401) {
             throw new Error("Você não tem acesso a este conteúdo. Verifique sua permissão.");
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
        console.error("Erro no carregamento do player de vídeo:", err);
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
  }, [user, authLoading, cursoId, playbackId]);


  if (loading) {
    return (
      <div className={`relative w-full aspect-video rounded-md overflow-hidden bg-slate-900 ${className}`}>
        <Skeleton className="w-full h-full opacity-20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span className="text-[10px] font-bold uppercase tracking-[4px] text-white/60">Sincronizando Player...</span>
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
        primaryColor="#FFFFFF"
        nohotkeys
        startTime={startTime}
        onTimeUpdate={(e) => {
            if (onTimeUpdate && e.target) {
                onTimeUpdate((e.target as any).currentTime);
            }
        }}
        onEnded={onEnded}
        className="w-full h-full object-contain"
        style={{
            "--controls-backdrop-color": "transparent",
            "--media-control-button-icon-color": "#FFFFFF",
            "--media-range-thumb-background": "#FFFFFF",
            "--media-range-track-active-background": "#FFFFFF",
            "--media-icon-color": "#FFFFFF",
            "--media-current-time-color": "#FFFFFF",
            "--media-duration-color": "#FFFFFF",
        } as any}
      />
    </div>
  );
}
