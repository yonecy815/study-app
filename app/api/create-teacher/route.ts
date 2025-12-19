import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Admin用Supabaseクライアント（Service Role Key使用）
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
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
    const { email, full_name, teacher_password, student_limit = 3, has_unlimited_license = false } = body;

    if (!email || !full_name || !teacher_password) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    // Admin用クライアントでユーザーを作成
    const supabaseAdmin = getAdminClient();

    // 1. Authユーザーを作成
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'temporary-password-' + Math.random().toString(36),
      email_confirm: true,
      user_metadata: {
        full_name
      }
    });

    if (createError || !authData.user) {
      return NextResponse.json({ error: 'ユーザー作成に失敗しました: ' + createError?.message }, { status: 500 });
    }

    // 2. 招待コードを生成
    const invite_code = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 3. profilesテーブルに登録
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        is_teacher: true,
        teacher_password,
        invite_code,
        student_limit,
        has_unlimited_license,
        created_at: new Date().toISOString()
      });

    if (profileError) {
      // プロフィール作成失敗時はAuthユーザーも削除
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: 'プロフィール作成に失敗しました: ' + profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      teacher: {
        id: authData.user.id,
        email,
        full_name,
        invite_code,
        student_limit,
        has_unlimited_license
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'サーバーエラー: ' + error.message }, { status: 500 });
  }
}
