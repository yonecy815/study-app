-- データベース構造確認用SQL

-- 1. profilesテーブルの構造を確認
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. problemsテーブルの構造を確認
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'problems'
ORDER BY ordinal_position;

-- 3. 既存のRLSポリシーを確認
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'problems', 'homeworks')
ORDER BY tablename, policyname;
