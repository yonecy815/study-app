-- =========================================
-- 管理者システムのセットアップ
-- =========================================
-- info@yonema.tokyo が管理者として先生を管理するシステム

-- 1. profilesテーブルに管理者システム用のカラムを追加
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS teacher_password TEXT,
ADD COLUMN IF NOT EXISTS student_limit INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS has_unlimited_license BOOLEAN DEFAULT FALSE;

-- 2. インデックスを作成（招待コード検索を高速化）
CREATE INDEX IF NOT EXISTS idx_profiles_invite_code ON profiles(invite_code);

-- 3. コメントを追加（データ構造の説明）
COMMENT ON COLUMN profiles.invite_code IS '先生の招待コード（8文字の英数字）';
COMMENT ON COLUMN profiles.teacher_password IS '先生が生徒登録時に確認用に使うパスワード';
COMMENT ON COLUMN profiles.student_limit IS '先生が登録できる生徒の上限数（デフォルト3人）';
COMMENT ON COLUMN profiles.has_unlimited_license IS '無制限ライセンスを持っているか';

-- セットアップ完了
SELECT 'Admin system setup completed successfully!' as status;

-- =========================================
-- 使い方
-- =========================================
-- 1. 管理者（info@yonema.tokyo）がログイン
-- 2. 「🔧 先生管理」ボタンから先生を登録
--    - メールアドレス、名前、パスワードを入力
--    - 生徒上限を設定（デフォルト3人）
--    - 無制限ライセンスも選択可能
-- 3. 先生に招待コードが自動発行される
-- 4. 先生は招待コードを使って生徒を登録
--    - 招待コードで先生を特定
--    - 生徒上限に達していないかチェック
--    - 生徒登録が完了
