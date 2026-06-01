-- =========================================
-- メッセージテーブルの追加
-- =========================================

-- 1. messagesテーブルを作成
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- 2. インデックスを作成（検索を高速化）
CREATE INDEX IF NOT EXISTS idx_messages_student ON messages(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_teacher ON messages(teacher_id, created_at DESC);

-- 3. Row Level Security (RLS) の設定
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（エラー回避）
DROP POLICY IF EXISTS "Students can view own messages" ON messages;
DROP POLICY IF EXISTS "Teachers can send messages to students" ON messages;
DROP POLICY IF EXISTS "Students can update read status" ON messages;

-- 生徒が自分宛のメッセージを閲覧可能
CREATE POLICY "Students can view own messages"
  ON messages FOR SELECT
  USING (auth.uid()::text = student_id);

-- 先生が自分の生徒にメッセージを送信可能
CREATE POLICY "Teachers can send messages to students"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid()::text = teacher_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id::text = messages.student_id
      AND profiles.teacher_id = messages.teacher_id
    )
  );

-- 先生が自分の送信したメッセージを閲覧可能
CREATE POLICY "Teachers can view own messages"
  ON messages FOR SELECT
  USING (auth.uid()::text = teacher_id);

-- 生徒が既読状態を更新可能
CREATE POLICY "Students can update read status"
  ON messages FOR UPDATE
  USING (auth.uid()::text = student_id)
  WITH CHECK (auth.uid()::text = student_id);

-- セットアップ完了
SELECT 'Messages table setup completed successfully!' as status;
