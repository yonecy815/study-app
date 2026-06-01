"use client";
import { useAppContext } from "@/app/context/AppContext";

export default function MasteredModal() {
  const {
    showMasteredModal,
    setShowMasteredModal,
    masteredProblems,
    selectedMasteredIds,
    setSelectedMasteredIds,
    masteredFilterFolder,
    setMasteredFilterFolder,
    selectedFolders,
    addTriangleToMastered,
  } = useAppContext();

  if (!showMasteredModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70] overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-3 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              👑 殿堂入り問題の再出題
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              選択中のフォルダ: {selectedFolders.join(", ") || "なし"}
            </p>
          </div>
          <button
            onClick={() => {
              setShowMasteredModal(false);
              setSelectedMasteredIds([]);
            }}
            className="text-gray-600 hover:text-gray-800 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {masteredProblems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">
              選択中のフォルダに殿堂入り問題がありません
            </p>
            <p className="text-sm text-gray-400">
              3日連続で初回正解した問題が殿堂入りになります
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-bold text-yellow-700">
                  👑 殿堂入り問題
                </span>
                とは、3日連続でその日の初回学習で正解した問題です。
              </p>
              <p className="text-sm text-gray-700 mt-1">
                再出題したい問題にチェックを入れて、「再出題リストに追加」ボタンを押してください。
              </p>
            </div>

            {/* フォルダフィルター */}
            <div className="bg-white border-2 border-gray-300 rounded-lg p-3">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📁 フォルダで絞り込み
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setMasteredFilterFolder("全て")}
                  className={`px-3 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                    masteredFilterFolder === "全て"
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:border-indigo-300"
                  }`}
                >
                  全て ({masteredProblems.length})
                </button>
                {Array.from(
                  new Set(masteredProblems.map((p) => p.subject))
                ).map((folder) => {
                  const count = masteredProblems.filter(
                    (p) => p.subject === folder
                  ).length;
                  return (
                    <button
                      key={folder}
                      onClick={() => setMasteredFilterFolder(folder)}
                      className={`px-3 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                        masteredFilterFolder === folder
                          ? "bg-indigo-600 text-white border-indigo-700 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:border-indigo-300"
                      }`}
                    >
                      {folder} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 殿堂入り問題一覧表 */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-300">
              <h4 className="font-bold text-lg text-gray-800 mb-3">
                殿堂入り問題一覧
                {masteredFilterFolder === "全て"
                  ? `（全${masteredProblems.length}問）`
                  : `（${masteredFilterFolder}: ${
                      masteredProblems.filter(
                        (p) => p.subject === masteredFilterFolder
                      ).length
                    }問）`}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-yellow-600 text-white">
                      <th className="border border-yellow-500 px-3 py-2 text-center">
                        選択
                      </th>
                      <th className="border border-yellow-500 px-3 py-2 text-left">
                        No.
                      </th>
                      <th className="border border-yellow-500 px-3 py-2 text-left">
                        問題
                      </th>
                      <th className="border border-yellow-500 px-3 py-2 text-center">
                        回答数
                      </th>
                      <th className="border border-yellow-500 px-3 py-2 text-center">
                        正解率
                      </th>
                      <th className="border border-yellow-500 px-3 py-2 text-center">
                        過去5回の履歴
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {masteredProblems
                      .filter(
                        (p) =>
                          masteredFilterFolder === "全て" ||
                          p.subject === masteredFilterFolder
                      )
                      .map((problem, index) => {
                        const history = problem.history || [];
                        const totalAttempts = history.length;
                        const correctCount = history.filter(
                          (h) => h.result === "○"
                        ).length;
                        const correctRate =
                          totalAttempts > 0
                            ? Math.round((correctCount / totalAttempts) * 100)
                            : 0;
                        const last5History = history.slice(-5).reverse();

                        return (
                          <tr
                            key={problem.id}
                            className={`${
                              index % 2 === 0 ? "bg-white" : "bg-yellow-50"
                            } hover:bg-yellow-100 transition-colors`}
                          >
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedMasteredIds.includes(
                                  problem.id
                                )}
                                onChange={() => {
                                  setSelectedMasteredIds((prev) =>
                                    prev.includes(problem.id)
                                      ? prev.filter((id) => id !== problem.id)
                                      : [...prev, problem.id]
                                  );
                                }}
                                className="w-5 h-5 cursor-pointer"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2 font-bold text-gray-700">
                              {index + 1}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-gray-800">
                              {problem.question_text.length > 30
                                ? problem.question_text.substring(0, 30) +
                                  "..."
                                : problem.question_text}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center text-gray-700">
                              {totalAttempts}回
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <span
                                className={`font-bold ${
                                  correctRate >= 80
                                    ? "text-green-600"
                                    : correctRate >= 50
                                    ? "text-yellow-600"
                                    : correctRate > 0
                                    ? "text-red-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {totalAttempts > 0 ? `${correctRate}%` : "-"}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-2 py-2">
                              <div className="flex flex-col gap-1 text-xs">
                                {last5History.length > 0 ? (
                                  last5History.map((h, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between gap-2"
                                    >
                                      <span
                                        className={`px-2 py-0.5 rounded font-bold ${
                                          h.result === "○"
                                            ? "bg-green-100 text-green-700"
                                            : h.result === "×"
                                            ? "bg-red-100 text-red-700"
                                            : h.result === "△"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "text-gray-400"
                                        }`}
                                      >
                                        {h.result}
                                      </span>
                                      <span className="text-gray-600 text-[10px]">
                                        {h.date}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-gray-400 text-center">
                                    未学習
                                  </span>
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

            {/* ボタン */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setShowMasteredModal(false);
                  setSelectedMasteredIds([]);
                }}
                className="bg-gray-400 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-500 shadow-md"
              >
                キャンセル
              </button>
              <button
                onClick={addTriangleToMastered}
                disabled={selectedMasteredIds.length === 0}
                className="bg-gradient-to-r from-orange-500 to-red-500 disabled:from-gray-300 disabled:to-gray-400 text-white px-8 py-3 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 shadow-lg disabled:shadow-none transition-all"
              >
                {selectedMasteredIds.length > 0
                  ? `${selectedMasteredIds.length}問を再出題リストに追加`
                  : "問題を選択してください"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
