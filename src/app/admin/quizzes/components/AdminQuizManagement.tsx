'use client';

import React, { useState, useEffect } from 'react';
import { Quiz, QuizStatus } from '@/lib/types/quiz';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  Eye, 
  Plus, 
  User, 
  Calendar,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import QuizForm from '@/app/(app)/dashboard-teacher/components/QuizForm';
import { cn } from '@/lib/utils';

type Tab = 'pending' | 'published' | 'my-quizzes';

export default function AdminQuizManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const loadQuizzes = () => {
      const stored = localStorage.getItem('mock_quizzes');
      if (stored) {
        setQuizzes(JSON.parse(stored));
      }
    };
    loadQuizzes();
    // Listen for storage changes (for local simulation)
    window.addEventListener('storage', loadQuizzes);
    return () => window.removeEventListener('storage', loadQuizzes);
  }, []);

  const filteredQuizzes = quizzes.filter(q => {
    if (activeTab === 'pending') return q.status === 'pending';
    if (activeTab === 'published') return q.status === 'published' && q.authorId !== 'admin-123';
    if (activeTab === 'my-quizzes') return q.authorId === 'admin-123';
    return true;
  });

  const handleAuthorize = (id: string) => {
    const updated = quizzes.map(q => 
      q.id === id ? { ...q, status: 'published' as QuizStatus } : q
    );
    setQuizzes(updated);
    localStorage.setItem('mock_quizzes', JSON.stringify(updated));
    setSelectedQuiz(null);
    toast.success('Quiz autorizado com sucesso!', {
      className: 'bg-slate-900 border-slate-800 text-white rounded-none font-montserrat',
    });
  };

  const handleAdminCreate = (data: any) => {
    const newQuiz: Quiz = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      authorName: 'Administrador',
      authorId: 'admin-123',
      createdAt: new Date(),
      status: 'published',
    };
    const updated = [...quizzes, newQuiz];
    setQuizzes(updated);
    localStorage.setItem('mock_quizzes', JSON.stringify(updated));
    setShowCreateForm(false);
    toast.success('Quiz criado e publicado!', {
      className: 'bg-slate-900 border-slate-800 text-white rounded-none font-montserrat',
    });
  };

  return (
    <div className="font-montserrat space-y-8 pb-20">
      {/* Header Admin */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#1D5F31] font-bold uppercase tracking-[4px] text-[10px]">
            <ShieldCheck size={14} />
            Área de Moderação
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-slate-900 uppercase leading-none max-w-xl">
            Gestão de <span className="text-[#1D5F31]">Quizzes</span>
          </h1>
        </div>
        
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-3 bg-slate-900 text-white font-bold uppercase tracking-widest px-8 py-4 rounded-none hover:bg-black transition-all shadow-xl active:scale-95 text-xs"
        >
          <Plus size={18} strokeWidth={3} /> Criar Quiz Admin
        </button>
      </div>

      {/* Tabs - Industrial Style */}
      <div className="flex border-b border-slate-200 gap-8">
        {(['pending', 'published', 'my-quizzes'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-4 px-2 text-[10px] font-bold uppercase tracking-[3px] transition-all relative",
              activeTab === tab ? "text-[#1D5F31]" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab === 'pending' && 'Pendentes'}
            {tab === 'published' && 'Aprovados'}
            {tab === 'my-quizzes' && 'Meus Quizzes'}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTabAdmin"
                className="absolute bottom-0 left-0 w-full h-1 bg-[#1D5F31]" 
              />
            )}
          </button>
        ))}
      </div>

      {/* List content */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredQuizzes.length > 0 ? (
            filteredQuizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 p-6 rounded-none flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-[#1D5F31] transition-all"
              >
                <div className="flex items-center gap-6 flex-1">
                  <div className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-none text-white",
                    quiz.status === 'pending' ? "bg-amber-500" : "bg-[#1D5F31]"
                  )}>
                    {quiz.status === 'pending' ? <Clock size={20} /> : <CheckCircle size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg uppercase tracking-tight text-slate-900 group-hover:text-[#1D5F31] transition-colors">
                      {quiz.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <User size={12} className="text-slate-400" /> {quiz.authorName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" /> {new Date(quiz.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-none text-slate-600">
                        {quiz.questions.length} questões
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setSelectedQuiz(quiz)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-slate-200 px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    <Eye size={16} /> Visualizar
                  </button>
                  {quiz.status === 'pending' && (
                    <button
                      onClick={() => handleAuthorize(quiz.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#1D5F31] text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#164a26] transition-all shadow-md"
                    >
                      <CheckCircle size={16} /> Autorizar
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 border-2 border-dashed border-slate-200 text-center uppercase">
              <p className="text-slate-400 font-bold tracking-widest text-xs">Nenhum quiz encontrado nesta categoria</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {selectedQuiz && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuiz(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-none shadow-2xl relative z-10 flex flex-col border border-slate-800"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[3px] text-slate-400 mb-2">Revisão de Conteúdo</div>
                  <h2 className="text-3xl font-bold uppercase tracking-tighter leading-none">{selectedQuiz.title}</h2>
                  <p className="text-slate-400 mt-4 text-sm font-medium">{selectedQuiz.description}</p>
                </div>
                <button onClick={() => setSelectedQuiz(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto space-y-8 bg-slate-50">
                {selectedQuiz.questions.map((q, idx) => (
                  <div key={q.id} className="bg-white p-6 border border-slate-200">
                    <div className="flex gap-4 mb-4">
                      <span className="w-8 h-8 shrink-0 bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 pt-1">{q.text}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                      {q.options.map((opt, oIdx) => (
                        <div 
                          key={oIdx}
                          className={cn(
                            "p-3 text-xs font-bold uppercase tracking-wide border",
                            q.correctAnswer === oIdx 
                              ? "bg-green-50 border-green-200 text-green-700 font-bold" 
                              : "bg-slate-50 border-slate-100 text-slate-500"
                          )}
                        >
                          {String.fromCharCode(65 + oIdx)}) {opt}
                          {q.correctAnswer === oIdx && " (CORRETA)"}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-white border-t border-slate-200 flex justify-end gap-4">
                <button
                  onClick={() => setSelectedQuiz(null)}
                  className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all border border-slate-200"
                >
                  Fechar
                </button>
                {selectedQuiz.status === 'pending' && (
                  <button
                    onClick={() => handleAuthorize(selectedQuiz.id)}
                    className="bg-[#1D5F31] text-white px-10 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#164a26] transition-all shadow-xl"
                  >
                    Autorizar Publicação
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Create Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-none shadow-2xl relative z-10 p-8 border border-white/10"
            >
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
                <h2 className="text-2xl font-bold uppercase tracking-tighter text-slate-900">Novo Quiz Administrativo</h2>
                <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-900">
                  <X size={24} />
                </button>
              </div>
              <QuizForm isAdmin onSave={handleAdminCreate} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
