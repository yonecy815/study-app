"use client";
import { useAppContext } from "@/app/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import { formatError } from "@/app/context/AppContext";

export function StudentDetailView() {
  const {
    session,
    targetStudent,
    availableFolders,
    folderCounts,
    homeworkFolders,
    toggleHomeworkFolder,
    assignHomework,
    isSubmitting,
    importFolderName, setImportFolderName,
    csvText, setCsvText,
    handleImport,
    selectedFolders,
    toggleFolder,
    exportStartDate, setExportStartDate,
    exportEndDate, setExportEndDate,
    generateExportData,
    exportData,
    maxResultCols,
    copyToClipboard,
    editProblems,
    editFilterFolder, setEditFilterFolder,
    editSearchText, setEditSearchText,
    loadEditProblems,
    selectedProblemIds,
    toggleProblemSelection,
    assignProblemsToStudent,
    assignedProblems,
    unassignProblem,
    status, setStatus,
    setMessageTargetStudent,
    setShowMessageModal,
    newStudentPassword, setNewStudentPassword,
    resetStudentPassword,
  } = useAppContext();

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
        <h3 className="font-bold text-lg text-purple-800 mb-1">
          👤 {targetStudent?.full_name || targetStudent?.email}
        </h3>
        <p className="text-sm text-gray-600">のデータを操作中</p>
      </div>

      {/* メッセージ送信ボタン */}
      <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-300">
        <button
          onClick={() => {
            if (targetStudent) {
              setMessageTargetStudent(targetStudent);
              setShowMessageModal(true);
            }
          }}
          className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2"
        >
          ✉️ この生徒にメッセージを送信
        </button>
      </div>

      {/* パスワードリセット */}
      <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
        <h4 className="font-bold text-yellow-800 mb-2">🔑 パスワードをリセット</h4>
        <p className="text-xs text-gray-500 mb-2">生徒がパスワードを忘れた場合に使用してください</p>
        <input
          type="password"
          className="w-full border-2 border-yellow-200 p-2 rounded mb-2 text-sm"
          placeholder="新しいパスワード（6文字以上）"
          value={newStudentPassword}
          onChange={(e) => setNewStudentPassword(e.target.value)}
        />
        <button
          onClick={resetStudentPassword}
          disabled={isSubmitting}
          className="w-full bg-yellow-600 text-white py-2 rounded font-bold hover:bg-yellow-700 disabled:opacity-50"
        >
          パスワードをリセット
        </button>
      </div>

      <div className="space-y-8">
        {/* 問題割り当てセクション */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h4 className="font-bold text-gray-700 mb-3">
            📚 問題を割り当て
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            先生が作成した問題から、この生徒に割り当てる問題を選択してください
          </p>

          {/* フォルダ選択で一括割り当て */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📁 フォルダを選択して一括割り当て
            </label>
            <p className="text-xs text-gray-500 mb-2">
              フォルダを選択すると、そのフォルダ内の全ての問題が自動的に割り当てられます
            </p>
            <div className="flex flex-wrap gap-2">
              {availableFolders.map((f) => (
                <button
                  key={f}
                  onClick={async () => {
                    if (!session?.user?.id || !targetStudent) return;

                    setStatus("割り当て中...");

                    const { data: problems } = await supabase
                      .from("problems")
                      .select("id")
                      .eq("user_id", session.user.id)
                      .eq("subject", f);

                    if (!problems || problems.length === 0) {
                      setStatus(`${f}に問題がありません`);
                      return;
                    }

                    const records = problems.map((p) => ({
                      student_id: targetStudent.id,
                      problem_id: p.id,
                      assigned_by: session.user.id,
                    }));

                    const { error } = await supabase
                      .from("student_problems")
                      .upsert(records, {
                        onConflict: 'student_id,problem_id',
                        ignoreDuplicates: true,
                      });

                    if (error) {
                      setStatus("エラー: " + formatError(error.message));
                    } else {
                      setStatus(`✅ ${f}の${problems.length}問を割り当てました！`);
                      // loadAssignedProblems is called via context but we import it here
                    }
                  }}
                  className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-bold text-sm border-2 border-indigo-300"
                >
                  {f} ({folderCounts[f] || 0}問)
                </button>
              ))}
            </div>
          </div>

          {/* 個別選択オプション（詳細） */}
          <details className="mb-3">
            <summary className="cursor-pointer text-sm font-bold text-gray-600 hover:text-gray-800">
              🔍 個別に問題を選択する（詳細設定）
            </summary>
            <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded">
              {/* フォルダフィルタ */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  フォルダ
                </label>
                <select
                  value={editFilterFolder}
                  onChange={(e) => setEditFilterFolder(e.target.value)}
                  className="w-full border p-2 rounded text-sm"
                >
                  <option value="">すべて</option>
                  {availableFolders.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* 検索 */}
              <div>
                <input
                  type="text"
                  value={editSearchText}
                  onChange={(e) => setEditSearchText(e.target.value)}
                  className="w-full border p-2 rounded text-sm"
                  placeholder="問題文で検索"
                />
              </div>

              <button
                onClick={loadEditProblems}
                className="w-full bg-blue-500 text-white p-2 rounded font-bold hover:bg-blue-600"
              >
                🔍 問題を検索
              </button>

              {/* 問題リスト（チェックボックス付き） */}
              {editProblems.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-2 bg-white">
                  {editProblems.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-start gap-2 p-2 bg-gray-50 rounded border hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedProblemIds.includes(p.id)}
                        onChange={() => toggleProblemSelection(p.id)}
                      />
                      <div className="flex-1 text-sm">
                        <p className="font-bold">{p.question_text}</p>
                        <p className="text-xs text-gray-600">
                          答え: {p.answer_text}
                        </p>
                        {p.subject && (
                          <span className="inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold mt-1">
                            {p.subject}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <button
                onClick={assignProblemsToStudent}
                className="w-full bg-indigo-600 text-white p-2 rounded font-bold hover:bg-indigo-700"
              >
                選択した問題を反映 ({selectedProblemIds.length}問)
              </button>
            </div>
          </details>

          {/* 割り当て済み問題の表示 */}
          <div className="mt-4 pt-4 border-t">
            <h5 className="text-sm font-bold text-gray-700 mb-2">
              ✅ 割り当て済み: <span className="text-indigo-600">{assignedProblems.length}問</span>
            </h5>
            {assignedProblems.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {assignedProblems.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs"
                  >
                    <div className="flex-1">
                      <p className="font-bold">{p.question_text}</p>
                      {p.subject && (
                        <span className="text-xs text-gray-600">{p.subject}</span>
                      )}
                    </div>
                    <button
                      onClick={() => unassignProblem(p.id)}
                      className="text-red-600 hover:text-red-700 font-bold ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h4 className="font-bold text-gray-700 mb-2">
            📅 宿題を選択 (今日やるべきもの)
          </h4>
          {availableFolders.length === 0 ? (
            <p className="text-sm text-gray-500">
              フォルダがありません
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {availableFolders.map((f) => (
                <button
                  key={f}
                  onClick={() => toggleHomeworkFolder(f)}
                  className={`px-3 py-1 rounded-full text-sm font-bold border ${
                    homeworkFolders.includes(f)
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  {homeworkFolders.includes(f) ? "✓ " : ""}
                  {f} ({folderCounts[f] || 0})
                </button>
              ))}
            </div>
          )}
          <button
            onClick={assignHomework}
            disabled={isSubmitting}
            className="w-full bg-orange-500 text-white p-3 rounded font-bold hover:bg-orange-600 disabled:opacity-50"
          >
            宿題を送信する
          </button>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h4 className="font-bold text-gray-700 mb-2">
            📥 問題アップロード
          </h4>
          <input
            type="text"
            className="w-full border p-2 rounded mb-2 text-sm"
            placeholder="フォルダ名"
            value={importFolderName}
            onChange={(e) => setImportFolderName(e.target.value)}
          />
          <textarea
            className="w-full h-20 border p-2 rounded text-sm font-mono mb-2"
            placeholder="CSV..."
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
          <button
            onClick={handleImport}
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white p-2 rounded font-bold disabled:opacity-50"
          >
            追加する
          </button>
        </div>

        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <h4 className="font-bold text-gray-700 mb-2">
            📊 データ出力
          </h4>
          <div className="flex flex-wrap gap-2 mb-2">
            {availableFolders.map((f) => (
              <button
                key={f}
                onClick={() => toggleFolder(f)}
                className={`px-2 py-1 rounded text-xs border ${
                  selectedFolders.includes(f)
                    ? "bg-blue-500 text-white"
                    : "bg-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              className="w-full border p-1 rounded text-sm"
            />
            <input
              type="date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              className="w-full border p-1 rounded text-sm"
            />
          </div>
          <button
            onClick={generateExportData}
            className="w-full bg-green-600 text-white p-2 rounded font-bold"
          >
            出力プレビュー
          </button>

          {exportData.length > 0 && (
            <div className="mt-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-gray-700">
                  {exportData.length} 件抽出しました
                </p>
                <button
                  onClick={copyToClipboard}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-green-600 shadow-sm"
                >
                  コピー
                </button>
              </div>
              <div className="overflow-auto max-h-60 border rounded bg-gray-50">
                <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                  <thead className="bg-gray-200 sticky top-0">
                    <tr>
                      <th className="p-2 border">日時</th>
                      <th className="p-2 border">フォルダ</th>
                      <th className="p-2 border">問題</th>
                      {Array.from({ length: maxResultCols }).map((_, i) => (
                        <th key={i} className="p-2 border text-center">
                          R{i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.map((row, i) => (
                      <tr key={i} className="border-b bg-white hover:bg-gray-50">
                        <td className="p-2">{row.lastDate}</td>
                        <td className="p-2 font-bold">{row.subject}</td>
                        <td className="p-2 truncate max-w-[150px]">
                          {row.question}
                        </td>
                        {row.results.map((res, j) => (
                          <td
                            key={j}
                            className={`p-2 text-center font-bold ${
                              res === "○"
                                ? "text-blue-500"
                                : "text-red-500"
                            }`}
                          >
                            {res}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-center font-bold text-green-600">{status}</p>
    </div>
  );
}
