export type HistoryItem = { date: string; result: "○" | "×" | "△" };
export type Problem = {
  id: number;
  question_text: string;
  answer_text: string;
  explanation: string;
  subject: string;
  is_correct: boolean;
  review_count: number;
  history: HistoryItem[];
  next_review_at: string;
  is_mastered: boolean;
  user_id: string;
};
export type ExportRow = {
  lastDate: string;
  subject: string;
  question: string;
  answer: string;
  results: string[];
};
export type Profile = {
  id: string;
  email: string;
  full_name: string;
  teacher_id?: string | null;
  invite_code?: string | null;
  is_teacher?: boolean;
  teacher_password?: string | null;
  student_limit?: number;
  has_unlimited_license?: boolean;
};
export type Message = {
  id: number;
  teacher_id: string;
  student_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
};
export type StudentProblemRow = {
  problem_id: number;
  problems: any; // Supabase は型生成なしでは join 結果を any[] として推論するため any を使用
};
