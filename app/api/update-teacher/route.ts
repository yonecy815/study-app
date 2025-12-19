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
    const { teacher_id, student_limit, has_unlimited_license, teacher_password } = body;

    if (!teacher_id) {
      return NextResponse.json({ error: '先生IDが必要です' }, { status: 400 });
    }

    // Admin用クライアントで更新
    const supabaseAdmin = getAdminClient();

    // 更新するフィールドを構築
    const updates: any = {};
    if (student_limit !== undefined) updates.student_limit = student_limit;
    if (has_unlimited_license !== undefined) updates.has_unlimited_license = has_unlimited_license;
    if (teacher_password) updates.teacher_password = teacher_password;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '更新する項目がありません' }, { status: 400 });
    }

    // profilesテーブルを更新
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', teacher_id);

    if (updateError) {
      return NextResponse.json({ error: '更新に失敗しました: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '先生情報を更新しました'
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'サーバーエラー: ' + error.message }, { status: 500 });
  }
}
