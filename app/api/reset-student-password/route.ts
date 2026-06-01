import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('環境変数が設定されていません');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getClient();

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 });
    }

    const body = await req.json();
    const { student_id, new_password } = body;

    if (!student_id || !new_password) {
      return NextResponse.json({ error: '生徒IDと新しいパスワードが必要です' }, { status: 400 });
    }
    if (new_password.length < 6) {
      return NextResponse.json({ error: 'パスワードは6文字以上で設定してください' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // 呼び出し元が管理者か、この生徒の担当先生かを確認
    const isAdmin = user.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
    if (!isAdmin) {
      const { data: studentProfile } = await supabaseAdmin
        .from('profiles')
        .select('teacher_id')
        .eq('id', student_id)
        .single();
      if (!studentProfile || studentProfile.teacher_id !== user.id) {
        return NextResponse.json({ error: 'この生徒のパスワードをリセットする権限がありません' }, { status: 403 });
      }
    }

    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      student_id,
      { password: new_password }
    );
    if (resetError) {
      return NextResponse.json({ error: 'パスワードのリセットに失敗しました: ' + resetError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'パスワードをリセットしました' });

  } catch (error: any) {
    return NextResponse.json({ error: 'サーバーエラー: ' + error.message }, { status: 500 });
  }
}
