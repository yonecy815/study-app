# 🚀 AIスパルタ学習帳

先生と生徒のための学習管理アプリケーション

## ✨ 主な機能

### 👩‍🏫 先生機能
- **招待コードシステム**: 生徒を簡単に招待
- **生徒管理**: 最大3人まで（無制限ライセンス対応）
- **宿題配信**: 特定のフォルダを宿題として設定
- **問題アップロード**: CSVまたは手動で問題を追加
- **学習データ出力**: 生徒の学習履歴をエクスポート
- **カスタム暗証番号**: 先生モード用の独自パスワード設定

### 👨‍🎓 生徒機能
- **学習モード**:
  - 🔥 苦手特訓（間違えた問題を優先）
  - 📝 ランダム学習
  - 🏠 宿題モード
- **問題管理**:
  - 問題の追加・編集・削除
  - フォルダ分け（科目別など）
  - キーワード検索
- **復習システム**: 間隔反復学習（SRS）対応

## 🛠️ セットアップ

### 1. 環境変数の設定

`.env.local` ファイルを作成し、Supabaseの情報を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. データベースのセットアップ

⚠️ **重要**: アプリを使用する前に、データベースのセットアップが必要です。

詳細な手順は [DATABASE-SETUP.md](DATABASE-SETUP.md) を参照してください。

**クイックセットアップ:**

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. SQL Editor を開く
3. `setup-database.sql` の内容をコピー＆ペーストして実行

### 3. アプリの起動

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリにアクセスできます。

## 📚 使い方

### 先生として始める

1. 通常のアカウント登録（メール・パスワード・名前）
2. ログイン後、⚙️ アイコンをクリック
3. デフォルト暗証番号 `soromonnoyubiwa` を入力
4. 先生モードが有効化され、招待コードが自動生成されます
5. 招待コードを生徒に共有

### 生徒として登録

1. 新規登録画面で以下を入力：
   - メールアドレス
   - パスワード
   - 名前
   - **先生の招待コード**（8文字）
2. 登録完了後、ログイン

### 問題の追加方法

#### CSV形式
```
問題,答え,解説,科目
りんご,apple,果物の名前,英語
1+1,2,基本的な足し算,算数
```

#### 手動入力
1. 「📥 追加」をクリック
2. 「✏️ 手動入力」タブを選択
3. 問題文・答え・解説・科目を入力

### 学習の流れ

1. **フォルダを選択**（複数選択可）
2. **学習モードを選択**：
   - 🔥 苦手特訓: 間違えた問題を優先的に復習
   - 📝 ランダム: すべての問題をランダムに出題
   - 🏠 宿題: 先生が設定した宿題を実施
3. **問題に答える**:
   - 「答えを見る」をクリック
   - 「◎ 覚えた!」または「✕ まだ...」を選択
4. **復習システム**: 正解した問題は翌日以降に再出題

## 🔐 デフォルト設定

- **先生モードのパスワード**: `soromonnoyubiwa`
- **無制限ライセンスキー**: `soromonnoyubiwa`
- **生徒数上限**: 3人（無制限ライセンスで解除可能）

### 先生モード設定のカスタマイズ

1. 先生モードでログイン
2. 「マイページ」に移動
3. 「👩‍🏫 先生モード設定」セクションで以下を変更可能：
   - 先生モード用の暗証番号
   - 無制限ライセンスの有効化

## 🗂️ プロジェクト構造

```
study-app/
├── app/
│   ├── layout.tsx          # レイアウト（フォント設定）
│   ├── page.tsx            # メインアプリケーション
│   └── globals.css         # グローバルスタイル
├── lib/
│   └── supabaseClient.ts   # Supabase クライアント設定
├── setup-database.sql      # データベースセットアップSQL
├── DATABASE-SETUP.md       # データベースセットアップ手順
└── .env.local              # 環境変数（gitignore済み）
```

## 🛡️ セキュリティ

- **Row Level Security (RLS)** で全テーブルを保護
- ユーザーは自分のデータのみアクセス可能
- 先生は自分の生徒のデータのみ管理可能
- 暗証番号はハッシュ化せずに保存（教育用アプリのため）

## 🐛 トラブルシューティング

### 先生・生徒システムが動作しない
→ [DATABASE-SETUP.md](DATABASE-SETUP.md) の手順に従ってデータベースをセットアップしてください

### 招待コードが表示されない
→ 先生モードを一度解除し、再度ログインしてください

### 生徒が登録できない
→ 招待コードが正しいか確認してください（大文字・小文字を区別）

### 生徒数の上限に達した
→ マイページから無制限ライセンスを有効化してください

## 🚀 技術スタック

- **フロントエンド**: Next.js 15 (App Router)
- **スタイリング**: Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **フォント**: Geist, Noto Serif JP

## 📄 ライセンス

MIT License

---

## Next.js について

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Supabase Documentation](https://supabase.com/docs)

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
