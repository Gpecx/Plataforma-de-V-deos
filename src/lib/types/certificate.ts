export interface ICertificate {
  userId?: string;
  courseId: string;
  courseTitle: string;
  studentName?: string;
  date_conclusao: string;
  credentialId: string;
  teacherName?: string;
  instructorName?: string;
  duration?: number;
  issueDate?: string;
  verificationCode?: string;
  percentage?: number;
  status?: string;
}
