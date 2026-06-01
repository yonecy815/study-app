"use client";
import { useAppContext } from "@/app/context/AppContext";

export function ExportView() {
  const {
    setMode,
    availableFolders,
    folderCounts,
    exportSelectedFolder, setExportSelectedFolder,
    exportFolderProblems, setExportFolderProblems,
    selectFolderForExport,
    status,
  } = useAppContext();

  return (
    <div>
      {!exportSelectedFolder ? (
        // フォルダ選択画面
        <div>
          <p className="mb-4 text-lg font-bold text-gray-700">📁 フォルダを選択してください</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {availableFolders.map((f) => (
              <button
                key={f}
                onClick={() => selectFolderForExport(f)}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 rounded-xl font-bold shadow-lg hover:from-indigo-600 hover:to-indigo-700 transition-all transform hover:scale-105"
              >
                📂 {f}
                <div className="text-xs mt-1 opacity-90">
                  {folderCounts[f] || 0}問
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // 問題一覧表示画面
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              📂 {exportSelectedFolder}
            </h3>
            <button
              onClick={() => {
                setExportSelectedFolder(null);
                setExportFolderProblems([]);
              }}
              className="text-gray-600 hover:text-gray-800 font-bold"
            >
              ← 戻る
            </button>
          </div>

          {exportFolderProblems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">問題がありません</p>
          ) : (
            <div className="space-y-6">
              {/* 進捗サマリー表 */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
                <h4 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                  📊 学習進捗一覧
                  <span className="text-sm font-normal text-gray-600">
                    （全{exportFolderProblems.length}問）
                  </span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-indigo-600 text-white">
                        <th className="border border-indigo-500 px-3 py-2 text-left">No.</th>
                        <th className="border border-indigo-500 px-3 py-2 text-left">問題</th>
                        <th className="border border-indigo-500 px-3 py-2 text-center">回答数</th>
                        <th className="border border-indigo-500 px-3 py-2 text-center">正解率</th>
                        <th className="border border-indigo-500 px-3 py-2 text-center">過去5回の履歴</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportFolderProblems.map((problem, index) => {
                        const history = problem.history || [];
                        const totalAttempts = history.length;
                        const correctCount = history.filter((h) => h.result === "○").length;
                        const correctRate = totalAttempts > 0
                          ? Math.round((correctCount / totalAttempts) * 100)
                          : 0;
                        const last5History = history.slice(-5).reverse();

                        return (
                          <tr
                            key={problem.id}
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition-colors`}
                          >
                            <td className="border border-gray-300 px-3 py-2 font-bold text-gray-700">
                              {index + 1}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-gray-800">
                              {problem.question_text.length > 30
                                ? problem.question_text.substring(0, 30) + "..."
                                : problem.question_text}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center text-gray-700">
                              {totalAttempts}回
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <span className={`font-bold ${
                                correctRate >= 80 ? 'text-green-600' :
                                correctRate >= 50 ? 'text-yellow-600' :
                                correctRate > 0 ? 'text-red-600' :
                                'text-gray-400'
                              }`}>
                                {totalAttempts > 0 ? `${correctRate}%` : '-'}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              <div className="flex flex-col gap-1 text-xs">
                                {last5History.length > 0 ? (
                                  last5History.map((h, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2">
                                      <span className={`px-2 py-0.5 rounded font-bold ${
                                        h.result === "○" ? 'bg-green-100 text-green-700' :
                                        h.result === "×" ? 'bg-red-100 text-red-700' :
                                        h.result === "△" ? 'bg-yellow-100 text-yellow-700' :
                                        'text-gray-400'
                                      }`}>
                                        {h.result}
                                      </span>
                                      <span className="text-gray-600 text-[10px]">
                                        {h.date}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-gray-400 text-center">未学習</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 問題詳細リスト */}
              <div>
                <h4 className="font-bold text-lg text-gray-800 mb-3">📝 問題詳細</h4>
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {exportFolderProblems.map((problem, index) => {
                    const recentHistory = (problem.history || []).slice(-5);

                    return (
                      <div
                        key={problem.id}
                        className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-bold text-gray-800 mb-1">
                              問{index + 1}: {problem.question_text}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              答え: {problem.answer_text}
                            </div>
                            {problem.explanation && (
                              <div className="text-xs text-gray-500 mb-2">
                                解説: {problem.explanation}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 正誤履歴（過去5回分） */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs font-bold text-gray-600 mb-2">
                            📊 最近の正誤履歴（過去5回分）
                          </div>
                          {recentHistory.length === 0 ? (
                            <div className="text-xs text-gray-400 italic">
                              まだ学習していません
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              {recentHistory.map((h, i) => (
                                <div
                                  key={i}
                                  className={`px-2 py-1 rounded text-xs font-bold ${
                                    h.result === "○"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {h.result}
                                </div>
                              ))}
                            </div>
                          )}
                          {recentHistory.length > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              最終: {recentHistory[recentHistory.length - 1].date}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
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
