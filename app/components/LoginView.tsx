"use client";
import { useAppContext } from "@/app/context/AppContext";

export function LoginView() {
  const {
    email, setEmail,
    password, setPassword,
    fullName, setFullName,
    inviteCode, setInviteCode,
    isSubmitting,
    status,
    handleLogin,
    handleSignUp,
  } = useAppContext();

  return (
    <div className="space-y-4 max-w-sm mx-auto mt-10">
      <h2 className="text-center font-bold text-2xl">ログイン</h2>
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800 font-bold mb-1">
          📌 ログイン方法
        </p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>👨‍🏫 <strong>先生</strong>: メールアドレスを入力</li>
          <li>👨‍🎓 <strong>生徒</strong>: 生徒名を入力（例: taro）</li>
        </ul>
      </div>
      <input
        className="w-full border p-3 rounded"
        type="text"
        placeholder="メールアドレス または 生徒名"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full border p-3 rounded"
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="border-t pt-4 mt-2 space-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1 font-bold">
            📝 新規登録（生徒用）
          </p>
          <p className="text-xs text-gray-500 mb-2">
            ※先生の登録は通常のメールアドレスで行ってください
          </p>
          <input
            className="w-full border p-3 rounded border-blue-200 bg-blue-50 mb-2"
            type="text"
            placeholder="生徒名（ログインに使用）例: taro"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <div>
            <label className="text-xs font-bold text-red-600 block mb-1">
              ⚠️ 先生の招待コード（必須）
            </label>
            <input
              className="w-full border-2 p-3 rounded border-red-200 bg-red-50 font-mono uppercase"
              type="text"
              placeholder="例: ABC12XYZ"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              ※先生から受け取った8文字のコードを入力
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={handleLogin}
        className="w-full bg-indigo-600 text-white p-3 rounded font-bold"
      >
        ログイン
      </button>
      <button
        onClick={handleSignUp}
        disabled={isSubmitting}
        className="w-full text-indigo-600 text-sm font-bold disabled:opacity-50"
      >
        🎓 生徒として新規登録
      </button>
      <p className="text-red-500 text-center">{status}</p>
    </div>
  );
}
