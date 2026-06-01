"use client";
import { useAppContext } from "@/app/context/AppContext";

export function ImportView() {
  const {
    setMode,
    importMode, setImportMode,
    importFolderName, setImportFolderName,
    csvText, setCsvText,
    handleImport,
    isSubmitting,
    manualQuestion, setManualQuestion,
    manualAnswer, setManualAnswer,
    manualExplanation, setManualExplanation,
    manualSubject, setManualSubject,
    handleManualAdd,
    status,
  } = useAppContext();

  return (
    <div className="text-center">
      <h2 className="font-bold mb-4">自主学習データの管理</h2>
      <div>
        {/* タブUI */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setImportMode("csv")}
            className={`flex-1 py-3 px-4 rounded-t-lg font-bold transition-colors ${
              importMode === "csv"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            📋 CSV入力
          </button>
          <button
            onClick={() => setImportMode("manual")}
            className={`flex-1 py-3 px-4 rounded-t-lg font-bold transition-colors ${
              importMode === "manual"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            ✏️ 手動入力
          </button>
        </div>

        {/* CSV入力フォーム */}
        {importMode === "csv" ? (
          <div>
            <input
              className="border p-2 w-full mb-2 rounded"
              placeholder="フォルダ名（例: 数学、英語）"
              value={importFolderName}
              onChange={(e) => setImportFolderName(e.target.value)}
            />
            <textarea
              className="border p-2 w-full mb-2 rounded font-mono text-sm"
              placeholder={"問題,答え,解説,科目\n例: りんご,apple,果物の名前,英語\n例: 1+1,2,基本的な足し算,算数"}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={8}
            />
            <button
              onClick={handleImport}
              disabled={isSubmitting}
              className="bg-indigo-600 text-white p-3 w-full rounded font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              💾 保存
            </button>
          </div>
        ) : (
          /* 手動入力フォーム */
          <div className="space-y-3">
            <div>
              <label className="block text-left text-sm font-bold text-gray-700 mb-1">
                問題文 <span className="text-red-500">*</span>
              </label>
              <input
                className="border p-3 w-full rounded font-[family-name:var(--font-noto-serif-jp)]"
                placeholder="例: りんごを英語で言うと？"
                value={manualQuestion}
                onChange={(e) => setManualQuestion(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-left text-sm font-bold text-gray-700 mb-1">
                答え <span className="text-red-500">*</span>
              </label>
              <input
                className="border p-3 w-full rounded font-[family-name:var(--font-noto-serif-jp)]"
                placeholder="例: apple"
                value={manualAnswer}
                onChange={(e) => setManualAnswer(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-left text-sm font-bold text-gray-700 mb-1">
                解説（任意）
              </label>
              <textarea
                className="border p-3 w-full rounded font-[family-name:var(--font-noto-serif-jp)]"
                placeholder="例: 果物の名前です"
                value={manualExplanation}
                onChange={(e) => setManualExplanation(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-left text-sm font-bold text-gray-700 mb-1">
                科目・フォルダ名（任意）
              </label>
              <input
                className="border p-3 w-full rounded"
                placeholder="例: 英語、数学"
                value={manualSubject}
                onChange={(e) => setManualSubject(e.target.value)}
              />
            </div>
            <button
              onClick={handleManualAdd}
              disabled={isSubmitting}
              className="bg-indigo-600 text-white p-3 w-full rounded font-bold hover:bg-indigo-700 transition-colors mt-2 disabled:opacity-50"
            >
              ➕ 問題を追加
            </button>
          </div>
        )}
      </div>
      <button
        onClick={() => setMode("menu")}
        className="mt-4 text-blue-500 underline"
      >
        戻る
      </button>
      <p className="text-green-600 mt-2">{status}</p>
    </div>
  );
}
