-- 既存の全問題のuser_idを先生のIDに変更
-- このSQLを実行すると、全ての問題が指定した先生のIDに紐づけられます

UPDATE problems
SET user_id = '78d32126-4e62-4744-9c1a-17db4cbeb551'::uuid;

-- 確認: 更新された問題の数を表示
SELECT COUNT(*) as updated_count FROM problems WHERE user_id = '78d32126-4e62-4744-9c1a-17db4cbeb551'::uuid;

-- 完了メッセージ
SELECT 'All problems have been updated to the new user_id!' as status;
