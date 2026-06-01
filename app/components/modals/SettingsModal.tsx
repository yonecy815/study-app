"use client";
import { useAppContext } from "@/app/context/AppContext";

export function SettingsModal() {
  const {
    showSettingsModal,
    setShowSettingsModal,
    settingsPassword, setSettingsPassword,
    unlockSettings,
  } = useAppContext();

  if (!showSettingsModal) return null;

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-xs">
        <h3 className="font-bold text-lg mb-4">先生モード設定</h3>
        <input
          type="password"
          placeholder="パスワード"
          className="w-full border p-2 rounded mb-4"
          value={settingsPassword}
          onChange={(e) => setSettingsPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettingsModal(false)}
            className="flex-1 bg-gray-300 py-2 rounded"
          >
            閉じる
          </button>
          <button
            onClick={unlockSettings}
            className="flex-1 bg-purple-600 text-white py-2 rounded font-bold"
          >
            解除
          </button>
        </div>
      </div>
    </div>
  );
}
