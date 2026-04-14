export interface ICertificate {
  id?: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  instructorName: string;
  issueDate: string;
  verificationCode: string;
  percentage: number;
  status: 'pending_rules' | 'issued';
}
