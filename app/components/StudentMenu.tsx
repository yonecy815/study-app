"use client";
import { useAppContext } from "@/app/context/AppContext";

export function StudentMenu() {
  const {
    session,
    setMode,
    status, setStatus,
    availableFolders,
    folderCounts,
    selectedFolders,
    toggleFolder,
    todaysHomeworks,
    unreadMessageCount,
    messages,
    markMessagesAsRead,
    studyMode, setStudyMode,
    studyIsWeak, setStudyIsWeak,
    studySelectedFolders, setStudySelectedFolders,
    showStudySettings, setShowStudySettings,
    showProgressModal, setShowProgressModal,
    progressFolder, setProgressFolder,
    progressProblems, setProgressProblems,
    showMasteredModal, setShowMasteredModal,
    masteredProblems,
    masteredFilterFolder, setMasteredFilterFolder,
    selectedMasteredIds, setSelectedMasteredIds,
    useRangeSelection, setUseRangeSelection,
    rangeStart, setRangeStart,
    rangeEnd, setRangeEnd,
    isSequentialOrder, setIsSequentialOrder,
    studyProblemCount, setStudyProblemCount,
    startStudy,
    showFolderProgress,
    showMasteredProblems,
    addTriangleToMastered,
    loadEditProblems,
  } = useAppContext();

  return (
    <div className="space-y-6 mt-2">
      {/* メッセージセクション（常に表示） */}
      <div className={`p-4 rounded-xl border-2 ${
        unreadMessageCount > 0
          ? 'bg-blue-50 border-blue-300 animate-in fade-in zoom-in duration-300'
          : 'bg-gray-50 border-gray-300'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-bold text-lg mb-1 ${
              unreadMessageCount > 0 ? 'text-blue-800' : 'text-gray-700'
            }`}>
              ✉️ 先生からのメッセージ
            </h3>
            <p className={`text-sm ${
              unreadMessageCount > 0 ? 'text-blue-600 font-bold' : 'text-gray-600'
            }`}>
              {unreadMessageCount > 0
                ? `未読メッセージが ${unreadMessageCount} 件あります`
                : `メッセージ: ${messages.length} 件`}
            </p>
          </div>
          <button
            onClick={() => {
              setMode("messages");
              if (unreadMessageCount > 0) {
                markMessagesAsRead();
              }
            }}
            className={`px-4 py-2 rounded-lg font-bold shadow-md ${
              unreadMessageCount > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-400 text-white hover:bg-gray-500'
            }`}
          >
            {unreadMessageCount > 0 ? '確認する' : '見る'}
          </button>
        </div>
      </div>

      {todaysHomeworks.length > 0 && (
        <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200 animate-in fade-in zoom-in duration-300">
          <h3 className="font-bold text-orange-800 text-lg mb-1">
            🏠 今日の宿題 (名前:{" "}
            {session?.user?.user_metadata?.full_name || "ゲスト"})
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {todaysHomeworks.map((f) => (
              <span
                key={f}
                className="bg-white px-2 py-1 rounded text-sm border text-orange-600 font-bold"
              >
                {f} ({folderCounts[f] || 0})
              </span>
            ))}
          </div>
          <button
            onClick={() => {
              setStudyMode("homework");
              setStudyIsWeak(true);
              setStudySelectedFolders(todaysHomeworks);
              setShowStudySettings(true);
            }}
            className="w-full bg-orange-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-orange-700"
          >
            🔥 宿題特訓
          </button>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <h3 className="font-bold text-gray-700 mb-2">自主学習</h3>
        {availableFolders.length === 0 ? (
          <p className="text-sm text-gray-500">フォルダなし</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableFolders.map((f) => (
              <button
                key={f}
                onClick={() => toggleFolder(f)}
                className={`px-3 py-1 rounded-full text-sm font-bold border ${
                  selectedFolders.includes(f)
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-600"
                }`}
              >
                {selectedFolders.includes(f) ? "✓ " : ""}
                {f} ({folderCounts[f] || 0})
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid gap-3">
        <button
          onClick={() => {
            setStudyMode("self");
            setStudyIsWeak(true);
            setStudySelectedFolders(selectedFolders);
            setShowStudySettings(true);
          }}
          disabled={selectedFolders.length === 0}
          className="bg-blue-600 disabled:bg-gray-300 text-white p-4 rounded-xl font-bold shadow"
        >
          🔥 苦手特訓 (自主)
        </button>
        <button
          onClick={() => {
            setStudyMode("self");
            setStudyIsWeak(false);
            setStudySelectedFolders(selectedFolders);
            setShowStudySettings(true);
          }}
          disabled={selectedFolders.length === 0}
          className="bg-blue-400 disabled:bg-gray-300 text-white p-4 rounded-xl font-bold shadow"
        >
          📝 ランダム (自主)
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setMode("import")}
          className="bg-gray-100 p-3 rounded-xl font-bold text-gray-600"
        >
          📥 追加
        </button>
        <button
          onClick={() => {
            setMode("edit");
            loadEditProblems();
          }}
          className="bg-gray-100 p-3 rounded-xl font-bold text-gray-600"
        >
          ✏️ 編集
        </button>
        <button
          onClick={() => setMode("export")}
          className="bg-gray-100 p-3 rounded-xl font-bold text-gray-600"
        >
          📊 出力
        </button>
      </div>

      {/* 殿堂入り問題の再出題ボタン */}
      {selectedFolders.length > 0 && (
        <button
          onClick={() => showMasteredProblems()}
          className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-800 p-4 rounded-xl font-bold hover:from-yellow-500 hover:to-yellow-600 shadow-lg transition-all border-2 border-yellow-600"
        >
          👑 殿堂入り問題の再出題
        </button>
      )}

      {/* 学習設定モーダル */}
      {showStudySettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="font-bold text-xl text-gray-800">
              {studyMode === "homework" ? "🏠 宿題設定" : "📚 自主学習設定"}
            </h3>

            {/* フォルダ選択 */}
            {studyMode === "homework" ? (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  📁 宿題のフォルダを選択
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  学習したいフォルダをタップして選択してください
                </p>
                <div className="space-y-2 mb-3">
                  {todaysHomeworks.map((f) => (
                    <div key={f} className="flex gap-2 items-center">
                      <button
                        onClick={() => {
                          setStudySelectedFolders((prev) =>
                            prev.includes(f)
                              ? prev.filter((folder) => folder !== f)
                              : [...prev, f]
                          );
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                          studySelectedFolders.includes(f)
                            ? "bg-orange-500 text-white border-orange-600 shadow-md"
                            : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                        }`}
                      >
                        {studySelectedFolders.includes(f) ? "✓ " : ""}
                        {f} ({folderCounts[f] || 0})
                      </button>
                      <button
                        onClick={() => showFolderProgress(f)}
                        className="px-3 py-2 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all border border-blue-300"
                        title="このフォルダの進捗を確認"
                      >
                        📊
                      </button>
                    </div>
                  ))}
                </div>
                {studySelectedFolders.length === 0 && (
                  <p className="text-xs text-red-500 font-bold">
                    ⚠️ 少なくとも1つのフォルダを選択してください
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  📁 選択中のフォルダ
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedFolders.map((f) => (
                    <span
                      key={f}
                      className="px-3 py-1 rounded-full text-sm font-bold bg-indigo-500 text-white"
                    >
                      ✓ {f} ({folderCounts[f] || 0})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 殿堂入り問題の再出題ボタン */}
            {selectedFolders.length > 0 && (
              <div>
                <button
                  onClick={() => showMasteredProblems()}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-800 p-3 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-600 shadow-md transition-all border-2 border-yellow-600"
                >
                  👑 殿堂入り問題の再出題
                </button>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  選択中のフォルダの殿堂入り問題を確認・再出題できます
                </p>
              </div>
            )}

            {/* 問題範囲選択の切り替え */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📋 学習方法を選択
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setUseRangeSelection(false)}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
                    !useRangeSelection
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  問題数で選択
                </button>
                <button
                  onClick={() => setUseRangeSelection(true)}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
                    useRangeSelection
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  範囲で選択
                </button>
              </div>
            </div>

            {/* 問題数選択（範囲選択がOFFの場合） */}
            {!useRangeSelection && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  🔢 問題数を選択
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  選んだ問題数の中で、全問正解するまで繰り返します
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20, 30, 50, 100, 999].map((count) => (
                    <button
                      key={count}
                      onClick={() => setStudyProblemCount(count)}
                      className={`p-2 rounded font-bold text-sm ${
                        studyProblemCount === count
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {count === 999 ? "全部" : `${count}問`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 範囲選択（範囲選択がONの場合） */}
            {useRangeSelection && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  📍 問題番号の範囲を指定
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  フォルダ内の通し番号で、何問目から何問目まで学習するかを選択してください
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      開始問題番号
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border-2 border-gray-300 rounded-lg p-2 text-center font-bold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      終了問題番号
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border-2 border-gray-300 rounded-lg p-2 text-center font-bold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                  💡 {rangeStart}問目〜{rangeEnd}問目を学習します
                  （合計 {Math.max(0, rangeEnd - rangeStart + 1)}問）
                </div>
              </div>
            )}

            {/* 出題順序選択 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🔀 出題順序を選択
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsSequentialOrder(false)}
                  className={`py-3 px-4 rounded-lg font-bold transition-all border-2 ${
                    !isSequentialOrder
                      ? "bg-purple-600 text-white border-purple-700 shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
                  }`}
                >
                  <div className="text-lg mb-1">🎲</div>
                  <div className="text-sm">ランダム</div>
                </button>
                <button
                  onClick={() => setIsSequentialOrder(true)}
                  className={`py-3 px-4 rounded-lg font-bold transition-all border-2 ${
                    isSequentialOrder
                      ? "bg-purple-600 text-white border-purple-700 shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
                  }`}
                >
                  <div className="text-lg mb-1">📊</div>
                  <div className="text-sm">順番通り</div>
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {isSequentialOrder
                  ? "📊 問題を番号順に出題します"
                  : "🎲 問題をランダムな順序で出題します"}
              </div>
            </div>

            {/* 開始ボタン */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setShowStudySettings(false)}
                className="flex-1 bg-gray-400 text-white p-3 rounded-lg font-bold hover:bg-gray-500"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (useRangeSelection) {
                    if (rangeStart > rangeEnd) {
                      setStatus("⚠️ 開始問題番号は終了問題番号以下にしてください");
                      return;
                    }
                    if (rangeStart < 1 || rangeEnd < 1) {
                      setStatus("⚠️ 問題番号は1以上にしてください");
                      return;
                    }
                  }

                  if (studyMode === "homework") {
                    if (studySelectedFolders.length === 0) {
                      setStatus("⚠️ 少なくとも1つのフォルダを選択してください");
                      return;
                    }
                    setShowStudySettings(false);
                    selectedFolders.length = 0;
                    selectedFolders.push(...studySelectedFolders);
                    startStudy(studyIsWeak, true);
                  } else {
                    setShowStudySettings(false);
                    startStudy(studyIsWeak, false);
                  }
                }}
                className="flex-1 bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700"
              >
                学習開始！
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 進捗確認モーダル */}
      {showProgressModal && progressFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-3 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                📊 {progressFolder} の進捗
              </h3>
              <button
                onClick={() => {
                  setShowProgressModal(false);
                  setProgressFolder(null);
                  setProgressProblems([]);
                }}
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
                          <th className="border border-indigo-500 px-3 py-2 text-left">No.</th>
                          <th className="border border-indigo-500 px-3 py-2 text-left">問題</th>
                          <th className="border border-indigo-500 px-3 py-2 text-center">回答数</th>
                          <th className="border border-indigo-500 px-3 py-2 text-center">正解率</th>
                          <th className="border border-indigo-500 px-3 py-2 text-center">最終結果</th>
                          <th className="border border-indigo-500 px-3 py-2 text-center">最終回答日</th>
                        </tr>
                      </thead>
                      <tbody>
                        {progressProblems.map((problem, index) => {
                          const history = problem.history || [];
                          const totalAttempts = history.length;
                          const correctCount = history.filter((h) => h.result === "○").length;
                          const correctRate = totalAttempts > 0
                            ? Math.round((correctCount / totalAttempts) * 100)
                            : 0;
                          const lastResult = history.length > 0 ? history[history.length - 1].result : "-";
                          const lastDate = history.length > 0 ? history[history.length - 1].date : "-";

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
                              <td className="border border-gray-300 px-3 py-2 text-center">
                                <span className={`px-2 py-1 rounded font-bold text-xs ${
                                  lastResult === "○" ? 'bg-green-100 text-green-700' :
                                  lastResult === "×" ? 'bg-red-100 text-red-700' :
                                  'text-gray-400'
                                }`}>
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
                    onClick={() => {
                      setShowProgressModal(false);
                      setProgressFolder(null);
                      setProgressProblems([]);
                    }}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md"
                  >
                    宿題選択に戻る
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 殿堂入り問題モーダル */}
      {showMasteredModal && (
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
                    <span className="font-bold text-yellow-700">👑 殿堂入り問題</span>とは、3日連続でその日の初回学習で正解した問題です。
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
                    {Array.from(new Set(masteredProblems.map((p) => p.subject))).map((folder) => {
                      const count = masteredProblems.filter((p) => p.subject === folder).length;
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
                      : `（${masteredFilterFolder}: ${masteredProblems.filter((p) => p.subject === masteredFilterFolder).length}問）`
                    }
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-yellow-600 text-white">
                          <th className="border border-yellow-500 px-3 py-2 text-center">選択</th>
                          <th className="border border-yellow-500 px-3 py-2 text-left">No.</th>
                          <th className="border border-yellow-500 px-3 py-2 text-left">問題</th>
                          <th className="border border-yellow-500 px-3 py-2 text-center">回答数</th>
                          <th className="border border-yellow-500 px-3 py-2 text-center">正解率</th>
                          <th className="border border-yellow-500 px-3 py-2 text-center">過去5回の履歴</th>
                        </tr>
                      </thead>
                      <tbody>
                        {masteredProblems
                          .filter((p) => masteredFilterFolder === "全て" || p.subject === masteredFilterFolder)
                          .map((problem, index) => {
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
                                className={`${index % 2 === 0 ? 'bg-white' : 'bg-yellow-50'} hover:bg-yellow-100 transition-colors`}
                              >
                                <td className="border border-gray-300 px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedMasteredIds.includes(problem.id)}
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
      )}
    </div>
  );
}
