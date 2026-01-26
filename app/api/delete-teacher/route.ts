import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Admin用Supabaseクライアント（Service Role Key使用）
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(`環境変数が設定されていません: URL=${!!url}, KEY=${!!key}`);
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// 通常のSupabaseクライアント（認証確認用）
function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getClient();

    // リクエストからセッショントークンを取得
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // セッションを確認
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    // 管理者権限チェック
    if (user.email !== process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    // リクエストボディを取得
    const body = await req.json();
    const { teacher_id } = body;

    if (!teacher_id) {
      return NextResponse.json({ error: '先生IDが必要です' }, { status: 400 });
    }

    // Admin用クライアントで削除
    const supabaseAdmin = getAdminClient();

    // 1. Authユーザーを削除（これによりカスケードでprofilesも削除される）
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(teacher_id);

    if (deleteError) {
      return NextResponse.json({ error: 'ユーザー削除に失敗しました: ' + deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '先生を削除しました'
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'サーバーエラー: ' + error.message }, { status: 500 });
  }
}
