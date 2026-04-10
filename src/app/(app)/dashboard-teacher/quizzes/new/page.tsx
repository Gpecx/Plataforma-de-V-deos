'use client';

import React from 'react';
import QuizForm from '../../components/QuizForm';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewQuizPage() {
  const router = useRouter();

  const handleSave = (data: any) => {
    // Simular salvamento
    console.log('Salvando quiz:', data);
    
    // Armazenar no localStorage para o Admin ver (mock)
    const existingQuizzes = JSON.parse(localStorage.getItem('mock_quizzes') || '[]');
    const newQuiz = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      authorName: 'Professor Daniel', // Mock teacher name
      authorId: 'teacher-123',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('mock_quizzes', JSON.stringify([...existingQuizzes, newQuiz]));

    toast.success('Quiz enviado para aprovação!', {
      description: 'O administrador revisará seu quiz em breve.',
      className: 'bg-slate-900 border-slate-800 text-white rounded-none font-montserrat',
    });

    router.push('/dashboard-teacher');
  };

  return (
    <div className="min-h-screen bg-transparent font-montserrat pb-24 pt-12 relative animate-in fade-in duration-500 max-w-5xl mx-auto">
      <header className="px-8 mb-12">
        <Link 
          href="/dashboard-teacher" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-[10px] font-bold uppercase tracking-[3px] mb-6 group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Voltar ao Painel
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-slate-900 uppercase leading-none max-w-xl">
          Criar Novo <span className="text-[#1D5F31]">Quiz</span>
        </h1>
        <p className="text-slate-900 mt-3 font-bold uppercase text-[10px] tracking-[3px]">
          Defina as questões e submeta para validação da equipe administrativa.
        </p>
      </header>

      <div className="px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <QuizForm onSave={handleSave} />
        </motion.div>
      </div>
    </div>
  );
}
