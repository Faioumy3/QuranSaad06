export type Role = 'admin' | 'teacher' | 'student';

export interface StudentSimple {
  id: string;
  name: string;
}

export interface Teacher {
  code: string;
  name: string;
  password?: string;
  email?: string;
  students: StudentSimple[];
}

export interface Student {
  id: string;
  name: string;
  code: string;
  password?: string;
  class?: string;
  registrationDate?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  teacherCode: string;
  studentName: string;
  status: 'present' | 'absent';
  notes?: string;
}

export interface StudentLog {
  id?: string;
  studentCode: string;
  date: string;
  dateDisplay: string;
  newMemorizing: string;
  review: string;
  listening: string;
  newTarget: string;
  notes?: string;
}

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  recipientId: string;
  recipientRole: Role;
  subject: string;
  content: string;
  timestamp: number; // Unix timestamp in ms
  read: boolean;
  replies?: Message[];
}

export interface Session {
  type: Role;
  data?: Teacher | Student | any; // 'any' for admin simple auth
}

export interface ExportData {
  teachers: Record<string, Teacher>;
  students: Student[];
  attendance: AttendanceRecord[];
  studentLogs: Record<string, StudentLog[]>;
  messages?: Message[];
}