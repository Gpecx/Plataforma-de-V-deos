"use client";

import { useEffect, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { useAuth } from "@/hooks/use-auth";
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
      <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-muted ${className}`}>
        <Skeleton className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-400 p-6 text-center ${className}`}>
        <AlertCircle className="w-10 h-10 mb-4 text-red-500/80" />
        <p className="text-sm md:text-base font-medium">{error || "Não foi possível carregar o player."}</p>
      </div>
    );
  }

  return (
    <div 
        className={`relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg ${className}`}
        onContextMenu={(e) => e.preventDefault()}
    >
      <MuxPlayer
        playbackId={playbackId}
        tokens={{ playback: token }}
        nohotkeys
        className="w-full h-full object-cover"
      />
    </div>
  );
}
