"use client";
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 bg-[#1D5F31] text-white px-4 py-2 hover:bg-[#164a26] transition-all"
      style={{ borderRadius: '0px' }} // Padrão PowerPlay
    >
      {copied ? <Check size={18} /> : <Copy size={18} />}
      {copied ? "Copiado!" : "Copiar Código"}
    </button>
  );
}
