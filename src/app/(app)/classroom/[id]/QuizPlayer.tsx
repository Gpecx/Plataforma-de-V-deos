'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ChevronRight, HelpCircle, AlertCircle } from 'lucide-react';
import { Question } from '@/lib/types/quiz';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizPlayerProps {
  quizData: {
    id?: string;
    title?: string;
    description?: string;
    questions?: Question[];
  };
  onComplete: () => void;
}

export function QuizPlayer({ quizData, onComplete }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const questions = quizData.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleConfirm = () => {
    if (selectedOption === null) return;
    
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
    setIsConfirmed(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsConfirmed(false);
    } else {
      setIsFinished(true);
    }
  };

  useEffect(() => {
    if (isFinished) {
      onComplete();
    }
  }, [isFinished, onComplete]);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-slate-900 border border-slate-800">
        <AlertCircle size={48} className="text-amber-500 mb-4" />
        <h3 className="text-xl font-black uppercase tracking-tighter text-white">Nenhuma questão encontrada</h3>
        <p className="text-slate-400 text-sm mt-2 uppercase tracking-widest font-bold">Este quiz ainda não possui conteúdo.</p>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-slate-900 border border-slate-800 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 rounded-none border-2 border-green-500 flex items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Quiz Finalizado!</h3>
        <p className="text-slate-400 text-sm uppercase tracking-[4px] font-bold mb-8">RESULTADO DA AVALIAÇÃO ESTRATÉGICA</p>
        
        <div className="grid grid-cols-2 gap-8 mb-12 w-full max-w-md">
          <div className="p-6 border border-slate-800 bg-slate-800/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Acertos</p>
            <p className="text-3xl font-black text-white">{score} / {questions.length}</p>
          </div>
          <div className="p-6 border border-slate-800 bg-slate-800/50">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Aproveitamento</p>
            <p className="text-3xl font-black text-green-500">{percentage}%</p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-12 py-5 bg-green-600 text-white font-black uppercase tracking-[3px] text-xs hover:bg-green-500 transition-all shadow-2xl active:scale-95"
        >
          Refazer Avaliação
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 relative overflow-hidden font-exo">
      {/* Progress Bar Industrial */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
        <div 
          className="h-full bg-green-500 transition-all duration-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="p-8 md:p-12 flex flex-col h-full">
        <div className="flex justify-between items-center mb-12">
          <div>
            <span className="text-[10px] font-black text-green-500 uppercase tracking-[4px] block mb-1">DESAFIO DE CONHECIMENTO</span>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Questão {currentQuestionIndex + 1} de {questions.length}</h2>
          </div>
          <HelpCircle size={24} className="text-slate-700" />
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <p className="text-xl md:text-2xl font-bold text-white leading-tight">
                {currentQuestion.text}
              </p>

              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrect = index === currentQuestion.correctAnswer;
                  
                  let borderClass = "border-slate-800 hover:border-slate-600 bg-slate-800/30";
                  let textClass = "text-slate-300";
                  
                  if (isSelected && !isConfirmed) {
                    borderClass = "border-green-500 bg-green-500/10";
                    textClass = "text-white";
                  } else if (isConfirmed) {
                    if (isCorrect) {
                      borderClass = "border-green-500 bg-green-500/20";
                      textClass = "text-white";
                    } else if (isSelected) {
                      borderClass = "border-red-500 bg-red-500/10";
                      textClass = "text-red-400";
                    } else {
                      borderClass = "border-slate-800 opacity-40";
                    }
                  }

                  return (
                    <button
                      key={index}
                      disabled={isConfirmed}
                      onClick={() => setSelectedOption(index)}
                      className={cn(
                        "w-full p-6 text-left border-2 transition-all duration-300 flex items-center justify-between group rounded-xl",
                        borderClass
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "w-8 h-8 flex items-center justify-center font-black text-xs border-2 transition-all rounded-md",
                          isSelected ? "bg-green-500 border-green-500 text-white" : "border-slate-700 text-slate-500 group-hover:border-slate-500"
                        )}>                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className={cn("font-bold text-base transition-colors", textClass)}>
                          {option}
                        </span>
                      </div>
                      
                      {isConfirmed && isCorrect && <CheckCircle2 size={20} className="text-green-500" />}
                      {isConfirmed && isSelected && !isCorrect && <XCircle size={20} className="text-red-500" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-12 flex justify-end">
          {!isConfirmed ? (
            <button
              disabled={selectedOption === null}
              onClick={handleConfirm}
              className="px-12 py-5 bg-green-600 text-white font-black uppercase tracking-[3px] text-xs hover:bg-green-500 transition-all border-none shadow-xl disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              Confirmar Resposta
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-12 py-5 bg-white text-black font-black uppercase tracking-[3px] text-xs hover:bg-slate-200 transition-all border-none shadow-xl flex items-center gap-3 active:scale-95"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finalizar Quiz' : 'Próxima Questão'}
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
