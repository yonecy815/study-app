-- =========================================
-- 生徒のログイン名カラム追加
-- =========================================

-- 1. profilesテーブルにstudent_login_nameカラムを追加
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS student_login_name TEXT UNIQUE;

-- 2. インデックスを作成（ログイン時の検索を高速化）
CREATE INDEX IF NOT EXISTS idx_profiles_student_login ON profiles(student_login_name);

-- セットアップ完了
SELECT 'Student login name column added successfully!' as status;

-- =========================================
-- 使い方
-- =========================================
-- 生徒登録時:
--   1. student_login_name に生徒名を保存
--   2. Supabase Auth には「生徒名@student.local」で登録
--
-- ログイン時:
--   - 入力値に @ が含まれる → 先生ログイン
--   - 含まれない → 生徒ログイン
--     → student_login_name から検索して「@student.local」を付けてログイン
