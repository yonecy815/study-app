"use client";
import { useAppContext } from "@/app/context/AppContext";

export function EditView() {
  const {
    editProblems,
    editingProblem,
    editQuestion, setEditQuestion,
    editAnswer, setEditAnswer,
    editExplanation, setEditExplanation,
    editSubject, setEditSubject,
    editFilterFolder, setEditFilterFolder,
    editSearchText, setEditSearchText,
    availableFolders,
    startEditProblem,
    handleUpdateProblem,
    cancelEditProblem,
    handleDeleteProblem,
  } = useAppContext();

  return (
    <div>
      <h2 className="font-bold mb-4 text-center">問題の編集</h2>

      {/* フォルダフィルタ */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          📁 フォルダでフィルタ
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEditFilterFolder("")}
            className={`px-4 py-2 rounded-full font-bold transition-colors ${
              editFilterFolder === ""
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            すべて ({editProblems.length})
          </button>
          {availableFolders.map((folder) => {
            const count = editProblems.filter(
              (p) => p.subject === folder
            ).length;
            return (
              <button
                key={folder}
                onClick={() => setEditFilterFolder(folder)}
                className={`px-4 py-2 rounded-full font-bold transition-colors ${
                  editFilterFolder === folder
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {folder} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 検索バー */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">
          🔍 キーワード検索
        </label>
        <div className="relative">
          <input
            type="text"
            className="border p-3 w-full rounded pr-10"
            placeholder="問題文、答え、解説から検索..."
            value={editSearchText}
            onChange={(e) => setEditSearchText(e.target.value)}
          />
          {editSearchText && (
            <button
              onClick={() => setEditSearchText("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        {editSearchText && (
          <p className="text-xs text-gray-500 mt-1">
            「{editSearchText}」で検索中...
          </p>
        )}
      </div>

      {editingProblem ? (
        /* 編集フォーム */
        <div className="bg-white p-4 rounded-xl border-2 border-indigo-500 mb-4">
          <h3 className="font-bold text-lg mb-3 text-indigo-600">
            問題を編集中
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-left text-sm font-bold text-gray-700 mb-1">
                科目・フォルダ名 <span className="text-red-500">*</span>
              </label>
              <input
                className="border p-3 w-full rounded"
                placeholder="例: 英語、数学"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-left text-sm font-bold text-gray-700 mb-1">
                問題文 <span className="text-red-500">*</span>
              </label>
              <textarea
                className="border p-3 w-full rounded font-[family-name:var(--font-noto-serif-jp)]"
                placeholder="問題文を入力"
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-left text-sm font-bold text-gray-700 mb-1">
                答え <span className="text-red-500">*</span>
              </label>
              <input
                className="border p-3 w-full rounded font-[family-name:var(--font-noto-serif-jp)]"
                placeholder="答えを入力"
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-left text-sm font-bold text-gray-700 mb-1">
                解説（任意）
              </label>
              <textarea
                className="border p-3 w-full rounded font-[family-name:var(--font-noto-serif-jp)]"
                placeholder="解説を入力"
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleUpdateProblem}
                className="flex-1 bg-indigo-600 text-white p-3 rounded font-bold hover:bg-indigo-700"
              >
                💾 更新
              </button>
              <button
                onClick={cancelEditProblem}
                className="flex-1 bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 問題一覧 */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {(() => {
          let filteredProblems = editProblems.filter(
            (problem) =>
              editFilterFolder === "" ||
              problem.subject === editFilterFolder
          );

          if (editSearchText.trim()) {
            const searchLower = editSearchText.toLowerCase();
            filteredProblems = filteredProblems.filter(
              (problem) =>
                problem.question_text.toLowerCase().includes(searchLower) ||
                problem.answer_text.toLowerCase().includes(searchLower) ||
                problem.explanation.toLowerCase().includes(searchLower)
            );
          }

          if (editProblems.length === 0) {
            return (
              <p className="text-gray-500 text-center py-8">
                問題がありません
              </p>
            );
          }

          if (filteredProblems.length === 0) {
            if (editSearchText.trim()) {
              return (
                <p className="text-gray-500 text-center py-8">
                  「{editSearchText}」に一致する問題が見つかりませんでした
                </p>
              );
            }
            return (
              <p className="text-gray-500 text-center py-8">
                「{editFilterFolder}」の問題がありません
              </p>
            );
          }

          const resultCountText =
            editSearchText.trim() || editFilterFolder
              ? `${filteredProblems.length} 件の問題を表示中`
              : "";

          return (
            <>
              {resultCountText && (
                <div className="text-sm text-gray-600 font-bold mb-2 px-2">
                  {resultCountText}
                </div>
              )}
              {filteredProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-xs font-bold text-indigo-600 mb-1">
                        {problem.subject}
                      </div>
                      <div className="font-bold text-gray-800 mb-1 font-[family-name:var(--font-noto-serif-jp)]">
                        {problem.question_text}
                      </div>
                      <div className="text-sm text-red-600 font-bold font-[family-name:var(--font-noto-serif-jp)]">
                        答え: {problem.answer_text}
                      </div>
                      {problem.explanation && (
                        <div className="text-xs text-gray-600 mt-1 font-[family-name:var(--font-noto-serif-jp)]">
                          {problem.explanation}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => startEditProblem(problem)}
                        className="bg-blue-500 text-white px-3 py-2 rounded text-sm font-bold hover:bg-blue-600 whitespace-nowrap"
                      >
                        ✏️ 編集
                      </button>
                      <button
                        onClick={() => handleDeleteProblem(problem.id)}
                        className="bg-red-500 text-white px-3 py-2 rounded text-sm font-bold hover:bg-red-600 whitespace-nowrap"
                      >
                        🗑️ 削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          );
        })()}
      </div>
    </div>
  );
}
