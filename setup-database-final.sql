-- =========================================
-- 学習アプリ - データベースセットアップ（最終版）
-- =========================================
-- profiles.id = uuid
-- problems.user_id = uuid
-- profiles.teacher_id = text (新規追加)

-- 1. profilesテーブルに先生・生徒システム用のカラムを追加
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS teacher_id TEXT,
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_teacher BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS teacher_password TEXT,
  ADD COLUMN IF NOT EXISTS student_limit INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS has_unlimited_license BOOLEAN DEFAULT FALSE;

-- 2. invite_codeにインデックスを作成（検索を高速化）
CREATE INDEX IF NOT EXISTS idx_profiles_invite_code ON profiles(invite_code);
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_id ON profiles(teacher_id);

-- 3. homeworksテーブルを作成（存在しない場合）
CREATE TABLE IF NOT EXISTS homeworks (
  id BIGSERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  assigned_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, folder_name, assigned_date)
);

-- 4. homeworksテーブルにインデックスを作成
CREATE INDEX IF NOT EXISTS idx_homeworks_student_date ON homeworks(student_id, assigned_date);

-- 5. Row Level Security (RLS) の設定

-- profilesテーブルのRLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（エラー回避）
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can view their students" ON profiles;
DROP POLICY IF EXISTS "Anyone can search by invite code" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 全ユーザーが自分のプロフィールを閲覧可能
-- auth.uid() と id はどちらも uuid 型なのでキャスト不要
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 先生が自分の生徒のプロフィールを閲覧可能
-- teacher_id は text 型なので auth.uid() を text に変換
CREATE POLICY "Teachers can view their students"
  ON profiles FOR SELECT
  USING (teacher_id = auth.uid()::text);

-- 全ユーザーが招待コードで先生を検索可能（新規登録時に必要）
CREATE POLICY "Anyone can search by invite code"
  ON profiles FOR SELECT
  USING (invite_code IS NOT NULL);

-- ユーザーが自分のプロフィールを更新可能
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- homeworksテーブルのRLS
ALTER TABLE homeworks ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（エラー回避）
DROP POLICY IF EXISTS "Students can view own homeworks" ON homeworks;
DROP POLICY IF EXISTS "Teachers can manage student homeworks" ON homeworks;

-- 生徒が自分の宿題を閲覧可能
-- student_id は text 型
CREATE POLICY "Students can view own homeworks"
  ON homeworks FOR SELECT
  USING (student_id = auth.uid()::text);

-- 先生が自分の生徒の宿題を閲覧・作成・削除可能
CREATE POLICY "Teachers can manage student homeworks"
  ON homeworks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id::text = homeworks.student_id
      AND profiles.teacher_id = auth.uid()::text
    )
  );

-- 6. problemsテーブルのRLS確認（既存のテーブル）
-- problems.user_id は uuid 型

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Teachers can manage student problems" ON problems;
DROP POLICY IF EXISTS "Users can manage own problems" ON problems;
DROP POLICY IF EXISTS "Enable read access for users" ON problems;
DROP POLICY IF EXISTS "Enable insert access for users" ON problems;
DROP POLICY IF EXISTS "Enable update access for users" ON problems;
DROP POLICY IF EXISTS "Enable delete access for users" ON problems;

-- ユーザーが自分の問題を管理可能
-- auth.uid() と user_id はどちらも uuid 型
CREATE POLICY "Users can manage own problems"
  ON problems FOR ALL
  USING (auth.uid() = user_id);

-- 先生が自分の生徒の問題を閲覧・編集可能
CREATE POLICY "Teachers can manage student problems"
  ON problems FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE problems.user_id = profiles.id
      AND profiles.teacher_id = auth.uid()::text
    )
  );

-- 7. 便利なビュー: 先生ごとの生徒数を確認
-- 既存のビューを削除
DROP VIEW IF EXISTS teacher_student_counts;

-- 新しいビューを作成
CREATE VIEW teacher_student_counts AS
SELECT
  t.id as teacher_id,
  t.email as teacher_email,
  t.full_name as teacher_name,
  t.student_limit,
  t.has_unlimited_license,
  COUNT(s.id) as current_students,
  CASE
    WHEN t.has_unlimited_license THEN 9999 - COUNT(s.id)
    ELSE t.student_limit - COUNT(s.id)
  END as remaining_slots
FROM profiles t
LEFT JOIN profiles s ON s.teacher_id = t.id::text
WHERE t.is_teacher = true
GROUP BY t.id, t.email, t.full_name, t.student_limit, t.has_unlimited_license;

-- セットアップ完了
SELECT 'Database setup completed successfully!' as status;
