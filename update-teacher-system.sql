-- =========================================
-- 先生・生徒・問題システムの改善（修正版）
-- =========================================

-- 1. 生徒と問題の紐付けテーブルを作成
CREATE TABLE IF NOT EXISTS student_problems (
  id BIGSERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by TEXT, -- 誰が割り当てたか（先生ID or 生徒自身）
  UNIQUE(student_id, problem_id)
);

-- 2. インデックスを作成（検索を高速化）
CREATE INDEX IF NOT EXISTS idx_student_problems_student ON student_problems(student_id);
CREATE INDEX IF NOT EXISTS idx_student_problems_problem ON student_problems(problem_id);
CREATE INDEX IF NOT EXISTS idx_student_problems_assigned_by ON student_problems(assigned_by);

-- 3. student_problems テーブルのRLS設定
ALTER TABLE student_problems ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Students can view assigned problems" ON student_problems;
DROP POLICY IF EXISTS "Teachers can manage student assignments" ON student_problems;
DROP POLICY IF EXISTS "Students can manage own assignments" ON student_problems;

-- 生徒は自分に割り当てられた問題のみ閲覧可能
CREATE POLICY "Students can view assigned problems"
  ON student_problems FOR SELECT
  USING (student_id = auth.uid()::text);

-- 生徒は自分で作成した問題を自分に割り当て可能
CREATE POLICY "Students can manage own assignments"
  ON student_problems FOR ALL
  USING (
    student_id = auth.uid()::text
    AND assigned_by = auth.uid()::text
  );

-- 先生は自分の生徒への割り当てを管理可能
CREATE POLICY "Teachers can manage student assignments"
  ON student_problems FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id::text = student_problems.student_id
      AND profiles.teacher_id = auth.uid()::text
    )
  );

-- 4. problemsテーブルのRLSポリシーを更新
-- 先生は自分の生徒が作成した問題も閲覧・編集可能

DROP POLICY IF EXISTS "Teachers can view student problems" ON problems;

-- 先生が自分の生徒の問題を閲覧可能（編集は既存ポリシーで対応）
CREATE POLICY "Teachers can view student problems"
  ON problems FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = problems.user_id
      AND profiles.teacher_id = auth.uid()::text
    )
  );

-- セットアップ完了
SELECT 'Teacher system update completed successfully!' as status;
