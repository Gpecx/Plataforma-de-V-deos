export type QuizStatus = 'pending' | 'published';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  status: QuizStatus;
  questions: Question[];
  createdAt: Date;
}
