"use client";
import { useAppContext } from "@/app/context/AppContext";

export function MyPageView() {
  const {
    setMode,
    isTeacherMode,
    userProfile,
    myPageName, setMyPageName,
    myPageEmail, setMyPageEmail,
    myPagePassword, setMyPagePassword,
    newTeacherPassword, setNewTeacherPassword,
    unlimitedLicensePassword, setUnlimitedLicensePassword,
    status,
    handleUpdateProfile,
    updateTeacherPassword,
    unlockUnlimitedLicense,
  } = useAppContext();

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-700">
          👤 マイページ
        </h2>
        <button
          onClick={() => setMode("menu")}
          className="text-blue-500 underline text-sm"
        >
          メニューに戻る
        </button>
      </div>
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            名前 (表示名)
          </label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={myPageName}
            onChange={(e) => setMyPageName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            className="w-full border p-2 rounded"
            value={myPageEmail}
            onChange={(e) => setMyPageEmail(e.target.value)}
          />
          <p className="text-xs text-orange-500 mt-1">
            ※メールを変更すると再確認が必要です
          </p>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            新しいパスワード
          </label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            placeholder="変更する場合のみ入力"
            value={myPagePassword}
            onChange={(e) => setMyPagePassword(e.target.value)}
          />
        </div>
        <button
          onClick={handleUpdateProfile}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold shadow hover:bg-indigo-700"
        >
          情報を更新する
        </button>
      </div>

      {/* 先生モード管理 */}
      {isTeacherMode && userProfile && (
        <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-purple-800 border-b border-purple-200 pb-2">
            👩‍🏫 先生モード設定
          </h3>

          {/* 暗証番号変更 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              先生モード用の暗証番号を変更
            </label>
            <p className="text-xs text-gray-500 mb-2">
              現在の暗証番号: {userProfile.teacher_password ? "設定済み" : "デフォルト (testpass)"}
            </p>
            <input
              type="text"
              className="w-full border-2 border-purple-200 p-2 rounded mb-2"
              placeholder="新しい暗証番号"
              value={newTeacherPassword}
              onChange={(e) => setNewTeacherPassword(e.target.value)}
            />
            <button
              onClick={updateTeacherPassword}
              className="w-full bg-purple-600 text-white py-2 rounded font-bold hover:bg-purple-700"
            >
              暗証番号を更新
            </button>
          </div>

          {/* 無制限ライセンス */}
          {!userProfile.has_unlimited_license && (
            <div className="border-t border-purple-200 pt-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                🎁 無制限ライセンスを有効化
              </label>
              <p className="text-xs text-gray-500 mb-2">
                生徒数の上限を無制限にします
              </p>
              <input
                type="password"
                className="w-full border-2 border-green-200 p-2 rounded mb-2"
                placeholder="ライセンスキー"
                value={unlimitedLicensePassword}
                onChange={(e) => setUnlimitedLicensePassword(e.target.value)}
              />
              <button
                onClick={unlockUnlimitedLicense}
                className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700"
              >
                ライセンスを有効化
              </button>
            </div>
          )}

          {/* ライセンス情報 */}
          {userProfile.has_unlimited_license && (
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3">
              <p className="text-green-800 font-bold text-center">
                ✨ 無制限ライセンスが有効です
              </p>
            </div>
          )}
        </div>
      )}

      <p className="text-center font-bold text-green-600">{status}</p>
    </div>
  );
}
