import React, { useRef, useEffect, useState } from 'react';
import { Users, MessageSquare, Pin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, Participant } from '@/types/live';

interface LiveChatPanelProps {
    role: 'teacher' | 'student';
    isLiveActive: boolean;
    messages: ChatMessage[];
    participants: Participant[];
    onSendMessage: (text: string) => void;
}

export const LiveChatPanel = ({
    role,
    isLiveActive,
    messages,
    participants,
    onSendMessage
}: LiveChatPanelProps) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messages.length > 0) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !isLiveActive) return;
        onSendMessage(chatInput);
        setChatInput('');
    };

    return (
        <div className="flex flex-col bg-white rounded-xl border border-black/10 shadow-sm overflow-hidden h-[500px] lg:h-full">
            {/* Tabs Header */}
            <div className="flex items-center border-b border-black/10 bg-slate-50/50 shrink-0">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'chat' ? 'text-slate-900 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                >
                    💬 Chat Ao Vivo
                    {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900" />}
                </button>
                <button
                    onClick={() => setActiveTab('participants')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'participants' ? 'text-slate-900 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                >
                    👥 Participantes ({participants.length})
                    {activeTab === 'participants' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-900" />}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 space-y-4 custom-scrollbar flex flex-col min-h-0">
                {activeTab === 'chat' ? (
                    <>
                        {messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 h-full space-y-3 opacity-60">
                                <MessageSquare size={32} className="text-slate-400" />
                                <p className="text-sm font-medium text-slate-500 max-w-[250px]">
                                    Nenhuma mensagem ainda. O chat será ativado quando a transmissão iniciar.
                                </p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col gap-1 ${msg.isTeacher ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-[10px] font-bold ${msg.isTeacher ? 'text-slate-900' : 'text-slate-600'}`}>{msg.name}</span>
                                        <span className="text-[8px] font-medium text-slate-400">{msg.time}</span>
                                        {msg.isTeacher && <span className="bg-slate-900 !text-white text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-sm">Professor</span>}
                                    </div>
                                    <div
                                        className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${msg.isTeacher ? 'bg-slate-800 !text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={chatEndRef} />
                    </>
                ) : (
                    <div className="space-y-3 flex-1 flex flex-col">
                        {participants.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 h-full space-y-3 opacity-60">
                                <Users size={32} className="text-slate-400" />
                                <p className="text-sm font-medium text-slate-500">Nenhum participante na sala.</p>
                            </div>
                        ) : (
                            participants.map((p) => (
                                <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm hover:border-slate-300 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                                            {p.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-bold text-slate-800">{p.name}</span>
                                    </div>
                                    {p.online ? (
                                        <div className="flex items-center gap-1.5">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-green-600">Online</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Offline</span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Chat Input */}
            {activeTab === 'chat' && (
                <div className="p-4 bg-white border-t border-black/10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] shrink-0">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        {role === 'teacher' && (
                            <Button type="button" variant="outline" disabled={!isLiveActive} className="w-10 h-10 p-0 rounded-full border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 shrink-0 transition-colors disabled:opacity-50" title="Fixar Mensagem">
                                <Pin size={16} />
                            </Button>
                        )}
                        <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={isLiveActive ? "Responder ao chat..." : (role === 'teacher' ? "Inicie a transmissão para usar o chat" : "Aguarde o início da transmissão...")}
                            disabled={!isLiveActive}
                            className="h-10 bg-slate-50 hover:bg-white border-slate-200 rounded-full px-4 text-sm focus-visible:ring-slate-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        <Button type="submit" disabled={!chatInput.trim() || !isLiveActive} className="w-10 h-10 p-0 rounded-full bg-slate-900 text-white hover:bg-slate-800 shrink-0 disabled:opacity-50 transition-colors shadow-sm">
                            <Send size={16} className="-ml-0.5 mt-0.5" />
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
};
