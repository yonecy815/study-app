"use client";
import { useAppContext } from "@/app/context/AppContext";

export function TeacherProblemsView() {
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
    editProblems,
    editFilterFolder, setEditFilterFolder,
    editSearchText, setEditSearchText,
    availableFolders,
    folderCounts,
    loadEditProblems,
    editingProblem, setEditingProblem,
    editQuestion, setEditQuestion,
    editAnswer, setEditAnswer,
    editExplanation, setEditExplanation,
    editSubject, setEditSubject,
    startEditProblem,
    deleteProblem,
    saveEditProblem,
    status,
  } = useAppContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold border-b pb-2">
        📥 問題を追加・管理
      </h2>

      {/* CSV / 手動入力の切り替え */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setImportMode("csv")}
            className={`flex-1 py-2 px-4 rounded-lg font-bold ${
              importMode === "csv"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            📄 CSV入力
          </button>
          <button
            onClick={() => setImportMode("manual")}
            className={`flex-1 py-2 px-4 rounded-lg font-bold ${
              importMode === "manual"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            ✍️ 手動入力
          </button>
        </div>

        {importMode === "csv" ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                フォルダ名
              </label>
              <input
                type="text"
                className="w-full border-2 border-gray-200 p-2 rounded"
                placeholder="例: 英語、数学"
                value={importFolderName}
                onChange={(e) => setImportFolderName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                CSV データ（問題,答え,解説）
              </label>
              <textarea
                className="w-full h-32 border-2 border-gray-200 p-2 rounded font-mono text-sm"
                placeholder="りんごを英語で?,apple,果物の名前です"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
            </div>
            <button
              onClick={handleImport}
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white p-3 rounded font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              ➕ 問題を追加
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                問題文 <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border-2 border-gray-200 p-2 rounded"
                placeholder="例: りんごを英語で言うと？"
                value={manualQuestion}
                onChange={(e) => setManualQuestion(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                答え <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border-2 border-gray-200 p-2 rounded"
                placeholder="例: apple"
                value={manualAnswer}
                onChange={(e) => setManualAnswer(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                解説（任意）
              </label>
              <textarea
                className="w-full border-2 border-gray-200 p-2 rounded"
                placeholder="例: 果物の名前です"
                value={manualExplanation}
                onChange={(e) => setManualExplanation(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                科目・フォルダ名（任意）
              </label>
              <input
                className="w-full border-2 border-gray-200 p-2 rounded"
                placeholder="例: 英語、数学"
                value={manualSubject}
                onChange={(e) => setManualSubject(e.target.value)}
              />
            </div>
            <button
              onClick={handleManualAdd}
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white p-3 rounded font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              ➕ 問題を追加
            </button>
          </div>
        )}
      </div>

      {/* 問題一覧・編集 */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-gray-700 mb-3">📚 問題一覧</h3>

        {/* フィルタ・検索 */}
        <div className="mb-4 space-y-2">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              フォルダでフィルタ
            </label>
            <select
              value={editFilterFolder}
              onChange={(e) => setEditFilterFolder(e.target.value)}
              className="w-full border p-2 rounded text-sm"
            >
              <option value="">すべて</option>
              {availableFolders.map((f) => (
                <option key={f} value={f}>
                  {f} ({folderCounts[f] || 0})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              キーワード検索
            </label>
            <input
              type="text"
              value={editSearchText}
              onChange={(e) => setEditSearchText(e.target.value)}
              className="w-full border p-2 rounded text-sm"
              placeholder="問題文や答えで検索"
            />
          </div>
          <button
            onClick={loadEditProblems}
            className="w-full bg-blue-500 text-white p-2 rounded font-bold hover:bg-blue-600"
          >
            🔍 検索
          </button>
        </div>

        {/* 問題リスト */}
        {editProblems.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            問題がありません
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {editProblems.map((p) => (
              <div
                key={p.id}
                className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-bold text-sm">{p.question_text}</p>
                    <p className="text-xs text-gray-600">答え: {p.answer_text}</p>
                    {p.subject && (
                      <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold mt-1">
                        {p.subject}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditProblem(p)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold hover:bg-yellow-600"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => deleteProblem(p.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold hover:bg-red-600"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {editingProblem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-lg">問題を編集</h3>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                問題文
              </label>
              <input
                className="w-full border p-2 rounded"
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                答え
              </label>
              <input
                className="w-full border p-2 rounded"
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                解説
              </label>
              <textarea
                className="w-full border p-2 rounded"
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                科目・フォルダ名
              </label>
              <input
                className="w-full border p-2 rounded"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveEditProblem}
                className="flex-1 bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700"
              >
                保存
              </button>
              <button
                onClick={() => setEditingProblem(null)}
                className="flex-1 bg-gray-400 text-white p-2 rounded font-bold hover:bg-gray-500"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setMode("teacher")}
        className="w-full py-3 text-gray-500 underline"
      >
        メニューに戻る
      </button>
      <p className="text-center font-bold text-green-600">{status}</p>
    </div>
  );
}
