-- =========================================
-- 生徒の認証システム変更
-- =========================================

-- 1. studentsテーブルを新規作成
CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  login_name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. インデックスを作成
CREATE INDEX IF NOT EXISTS idx_students_teacher ON students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_login ON students(login_name);

-- 3. Row Level Security (RLS) の設定
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Teachers can manage their students" ON students;
DROP POLICY IF EXISTS "Students can view own data" ON students;

-- 先生が自分の生徒を管理可能
CREATE POLICY "Teachers can manage their students"
  ON students FOR ALL
  USING (teacher_id = auth.uid()::text);

-- 生徒は認証後に自分のデータを閲覧可能（カスタム認証で実装）
-- 注: Supabase Authを使わないため、このポリシーは無効化
-- CREATE POLICY "Students can view own data"
--   ON students FOR SELECT
--   USING (true);

-- 4. problemsテーブルの参照を更新
-- user_idをstudent_idに変更し、studentsテーブルを参照
ALTER TABLE problems
  ADD COLUMN IF NOT EXISTS student_id BIGINT REFERENCES students(id) ON DELETE CASCADE;

-- 既存のuser_idからstudent_idへのマイグレーションは手動で行う必要があります
-- （既存データがある場合）

-- 5. student_problemsテーブルの参照を更新
-- student_idをBIGINTに変更
-- 注: 既存データがある場合は、まずバックアップを取ってから実行してください
-- ALTER TABLE student_problems
--   DROP CONSTRAINT IF EXISTS student_problems_student_id_fkey;
-- ALTER TABLE student_problems
--   ALTER COLUMN student_id TYPE BIGINT USING student_id::bigint;
-- ALTER TABLE student_problems
--   ADD CONSTRAINT student_problems_student_id_fkey
--   FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- 6. homeworksテーブルの参照を更新
-- ALTER TABLE homeworks
--   DROP CONSTRAINT IF EXISTS homeworks_student_id_fkey;
-- ALTER TABLE homeworks
--   ALTER COLUMN student_id TYPE BIGINT USING student_id::bigint;
-- ALTER TABLE homeworks
--   ADD CONSTRAINT homeworks_student_id_fkey
--   FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- 7. messagesテーブルの参照を更新
-- ALTER TABLE messages
--   DROP CONSTRAINT IF EXISTS messages_student_id_fkey;
-- ALTER TABLE messages
--   ALTER COLUMN student_id TYPE BIGINT USING student_id::bigint;
-- ALTER TABLE messages
--   ADD CONSTRAINT messages_student_id_fkey
--   FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- セットアップ完了
SELECT 'Student authentication system updated successfully!' as status;

-- =========================================
-- 注意事項
-- =========================================
-- 1. このSQLは既存データベースに新しいテーブルを追加します
-- 2. 既存のprofilesテーブルは先生用として残ります
-- 3. student_problems, homeworks, messagesテーブルの参照変更は
--    既存データがない場合のみ実行してください
-- 4. 既存データがある場合は、データ移行スクリプトが必要です
