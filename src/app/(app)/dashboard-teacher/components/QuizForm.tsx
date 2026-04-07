'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Save, MoveUp, MoveDown, HelpCircle } from 'lucide-react';
import { Quiz, Question } from '@/lib/types/quiz';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizFormProps {
  initialData?: Partial<Quiz>;
  onSave: (data: Partial<Quiz>) => void;
  isAdmin?: boolean;
}

export default function QuizForm({ initialData, onSave, isAdmin = false }: QuizFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [questions, setQuestions] = useState<Partial<Question>[]>(
    initialData?.questions || [{ id: Math.random().toString(), text: '', options: ['', ''], correctAnswer: 0 }]
  );

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: Math.random().toString(), text: '', options: ['', ''], correctAnswer: 0 },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    const newOptions = [...(newQuestions[qIndex].options || [])];
    newOptions[oIndex] = value;
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex] = {
      ...newQuestions[qIndex],
      options: [...(newQuestions[qIndex].options || []), ''],
    };
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    const newOptions = (newQuestions[qIndex].options || []).filter((_, i) => i !== oIndex);
    newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
    setQuestions(newQuestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      questions: questions.map(q => ({
        ...q,
        id: q.id || Math.random().toString(),
      })) as Question[],
      status: isAdmin ? 'published' : 'pending',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-montserrat">
      {/* Quiz Header - Glassmorphism Slate */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-8 rounded-none shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#1D5F31]" />
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[3px] text-slate-400">Título do Quiz</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-4 rounded-none focus:outline-none focus:border-[#1D5F31] transition-all text-xl font-bold tracking-tight"
              placeholder="Ex: Fundamentos de Design Industrial"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[3px] text-slate-400">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white px-4 py-4 rounded-none focus:outline-none focus:border-[#1D5F31] transition-all h-24 resize-none"
              placeholder="Descreva o que será avaliado..."
            />
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-bold uppercase tracking-tighter text-slate-900 flex items-center gap-3">
            <HelpCircle size={24} className="text-[#1D5F31]" />
            Questões
          </h2>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-2 bg-[#1D5F31] text-white px-6 py-3 rounded-none font-bold uppercase tracking-widest text-[10px] hover:bg-[#164a26] transition-all active:scale-95 shadow-lg"
          >
            <Plus size={16} strokeWidth={3} /> Adicionar Questão
          </button>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {questions.map((q, qIndex) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 p-8 rounded-none shadow-sm relative group hover:border-slate-400 transition-all"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 group-hover:bg-[#1D5F31] transition-colors" />
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Questão {qIndex + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[3px] text-slate-500">Enunciado</label>
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-none focus:outline-none focus:border-slate-900 transition-all font-bold"
                      placeholder="Digite a pergunta aqui..."
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[3px] text-slate-500 block">Opções de Resposta</label>
                    {q.options?.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctAnswer === oIndex}
                          onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                          className="w-5 h-5 accent-[#1D5F31] cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          className={cn(
                            "flex-1 bg-slate-50 border px-4 py-3 rounded-none focus:outline-none transition-all text-sm",
                            q.correctAnswer === oIndex ? "border-[#1D5F31] ring-1 ring-[#1D5F31]/20" : "border-slate-200"
                          )}
                          placeholder={`Opção ${oIndex + 1}`}
                          required
                        />
                        {q.options && q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="text-[10px] font-bold uppercase tracking-widest text-[#1D5F31] hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Adicionar Opção
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end pt-8 sticky bottom-8">
        <button
          type="submit"
          className="flex items-center gap-3 bg-slate-900 text-white px-12 py-5 rounded-none font-bold uppercase tracking-[3px] hover:bg-black transition-all active:scale-95 shadow-2xl group"
        >
          <Save size={20} className="group-hover:scale-110 transition-transform" />
          {isAdmin ? 'Publicar Quiz' : 'Enviar para Aprovação'}
        </button>
      </div>
    </form>
  );
}
