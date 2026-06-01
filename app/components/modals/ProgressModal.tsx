"use client";
import { useAppContext } from "@/app/context/AppContext";

export default function ProgressModal() {
  const {
    showProgressModal,
    setShowProgressModal,
    progressFolder,
    setProgressFolder,
    progressProblems,
    setProgressProblems,
  } = useAppContext();

  if (!showProgressModal || !progressFolder) return null;

  const handleClose = () => {
    setShowProgressModal(false);
    setProgressFolder(null);
    setProgressProblems([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-3 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            📊 {progressFolder} の進捗
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-600 hover:text-gray-800 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {progressProblems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">問題がありません</p>
        ) : (
          <div className="space-y-4">
            {/* 進捗サマリー表 */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
              <h4 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                📊 学習進捗一覧
                <span className="text-sm font-normal text-gray-600">
                  （全{progressProblems.length}問）
                </span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-indigo-600 text-white">
                      <th className="border border-indigo-500 px-3 py-2 text-left">
                        No.
                      </th>
                      <th className="border border-indigo-500 px-3 py-2 text-left">
                        問題
                      </th>
                      <th className="border border-indigo-500 px-3 py-2 text-center">
                        回答数
                      </th>
                      <th className="border border-indigo-500 px-3 py-2 text-center">
                        正解率
                      </th>
                      <th className="border border-indigo-500 px-3 py-2 text-center">
                        最終結果
                      </th>
                      <th className="border border-indigo-500 px-3 py-2 text-center">
                        最終回答日
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressProblems.map((problem, index) => {
                      const history = problem.history || [];
                      const totalAttempts = history.length;
                      const correctCount = history.filter(
                        (h) => h.result === "○"
                      ).length;
                      const correctRate =
                        totalAttempts > 0
                          ? Math.round((correctCount / totalAttempts) * 100)
                          : 0;
                      const lastResult =
                        history.length > 0
                          ? history[history.length - 1].result
                          : "-";
                      const lastDate =
                        history.length > 0
                          ? history[history.length - 1].date
                          : "-";

                      return (
                        <tr
                          key={problem.id}
                          className={`${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-indigo-50 transition-colors`}
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
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <span
                              className={`px-2 py-1 rounded font-bold text-xs ${
                                lastResult === "○"
                                  ? "bg-green-100 text-green-700"
                                  : lastResult === "×"
                                  ? "bg-red-100 text-red-700"
                                  : "text-gray-400"
                              }`}
                            >
                              {lastResult}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-xs text-gray-600">
                            {lastDate !== "-" ? lastDate : "未学習"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 戻るボタン */}
            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md"
              >
                宿題選択に戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
