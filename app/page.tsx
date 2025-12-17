"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// --- 型定義 ---
type HistoryItem = { date: string; result: "○" | "×" };
type Problem = {
  id: number;
  question_text: string;
  answer_text: string;
  explanation: string;
  subject: string;
  is_correct: boolean;
  review_count: number;
  history: HistoryItem[];
  next_review_at: string;
  is_mastered: boolean;
  user_id: string;
};
type ExportRow = {
  lastDate: string;
  subject: string;
  question: string;
  answer: string;
  results: string[];
};
type Profile = { id: string; email: string; full_name: string };

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("menu");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // フォルダ管理（数も管理）
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [folderCounts, setFolderCounts] = useState<{ [key: string]: number }>(
    {}
  );
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

  // --- 先生・宿題・設定用 ---
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState("");
  const [isTeacherMode, setIsTeacherMode] = useState(false);

  const [studentList, setStudentList] = useState<Profile[]>([]);
  const [targetStudent, setTargetStudent] = useState<Profile | null>(null);
  const [homeworkFolders, setHomeworkFolders] = useState<string[]>([]);

  // --- インポート・エクスポート・学習用 ---
  const [importFolderName, setImportFolderName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [finished, setFinished] = useState(false);
  const [studyTitle, setStudyTitle] = useState("");
  const [exportData, setExportData] = useState<ExportRow[]>([]);
  const [maxResultCols, setMaxResultCols] = useState(0);
  const [exportStartDate, setExportStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [exportEndDate, setExportEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // --- マイページ用 ---
  const [myPageName, setMyPageName] = useState("");
  const [myPageEmail, setMyPageEmail] = useState("");
  const [myPagePassword, setMyPagePassword] = useState("");

  // --- 初期化 ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchFolders(session.user.id);
        fetchHomeworkButton(session.user.id);
        setMyPageName(session.user.user_metadata.full_name || "");
        setMyPageEmail(session.user.email || "");
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchFolders(session.user.id);
        fetchHomeworkButton(session.user.id);
        setMyPageName(session.user.user_metadata.full_name || "");
        setMyPageEmail(session.user.email || "");
      } else {
        setMode("menu");
        setIsTeacherMode(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchFolders = async (userId: string) => {
    const { data } = await supabase
      .from("problems")
      .select("subject")
      .eq("user_id", userId);
    if (data) {
      const counts: { [key: string]: number } = {};
      data.forEach((d) => {
        const subj = d.subject || "未分類";
        counts[subj] = (counts[subj] || 0) + 1;
      });
      setFolderCounts(counts);
      const folders = Object.keys(counts).sort();
      setAvailableFolders(folders);
      if (selectedFolders.length === 0) setSelectedFolders(folders);
    }
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setStudentList(data);
  };

  const [todaysHomeworks, setTodaysHomeworks] = useState<string[]>([]);
  const fetchHomeworkButton = async (userId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("homeworks")
      .select("folder_name")
      .eq("student_id", userId)
      .eq("assigned_date", today);
    if (data && data.length > 0) {
      setTodaysHomeworks(Array.from(new Set(data.map((d) => d.folder_name))));
    } else {
      setTodaysHomeworks([]);
    }
  };

  // --- 認証 ---
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setStatus("エラー: " + error.message);
  };
  const handleSignUp = async () => {
    if (!fullName) {
      setStatus("⚠️ 名前を入力してください");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) setStatus("エラー: " + error.message);
    else setStatus("登録確認メールを確認してください");
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- マイページ更新 ---
  const handleUpdateProfile = async () => {
    if (!session) return;
    setStatus("更新中...");
    const updates: any = { data: { full_name: myPageName } };
    if (myPageEmail !== session.user.email) updates.email = myPageEmail;
    if (myPagePassword) updates.password = myPagePassword;

    const { error: authError } = await supabase.auth.updateUser(updates);
    if (authError) {
      setStatus("更新エラー(Auth): " + authError.message);
      return;
    }

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ full_name: myPageName })
      .eq("id", session.user.id);

    if (dbError) {
      setStatus("更新エラー(DB): " + dbError.message);
    } else {
      setStatus("プロフィールを更新しました！");
      if (myPageEmail !== session.user.email)
        setStatus("確認メールが送信されました。");
      setMyPagePassword("");
    }
  };

  // --- 先生モード ---
  const unlockSettings = () => {
    if (settingsPassword === "soromonnoyubiwa") {
      setIsTeacherMode(true);
      setShowSettingsModal(false);
      setSettingsPassword("");
      fetchStudents();
      setMode("teacher");
    } else {
      alert("パスワードが違います");
    }
  };

  // --- CSV保存 ---
  const saveProblemsToDB = async (
    userId: string,
    csv: string,
    folderName: string
  ) => {
    const lines = csv.trim().split("\n");
    const records = [];
    const now = new Date().toISOString();
    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length >= 2) {
        records.push({
          user_id: userId,
          question_text: parts[0]?.trim(),
          answer_text: parts[1]?.trim(),
          explanation: parts[2]?.trim() || "",
          subject: folderName || parts[3]?.trim() || "未分類",
          is_correct: false,
          review_count: 0,
          history: [],
          next_review_at: now,
          is_mastered: false,
        });
      }
    }
    const { error } = await supabase.from("problems").insert(records);
    if (error) throw error;
    return records.length;
  };

  const handleImport = async () => {
    const targetId =
      isTeacherMode && targetStudent ? targetStudent.id : session.user.id;
    if (!targetId) return;
    setStatus("保存中...");
    try {
      const count = await saveProblemsToDB(
        targetId,
        csvText,
        importFolderName.trim()
      );
      setStatus(`${count} 件の問題を保存しました！`);
      setCsvText("");
      setImportFolderName("");
      if (!isTeacherMode) fetchFolders(targetId);
      else fetchTargetStudentFolders(targetId);
    } catch (error: any) {
      setStatus("保存失敗: " + error.message);
    }
  };

  const openStudentDetail = async (student: Profile) => {
    setTargetStudent(student);
    setMode("teacher_student_detail");
    setStatus(`${student.full_name || student.email} さんのデータを編集中`);
    fetchTargetStudentFolders(student.id);
  };

  const fetchTargetStudentFolders = async (studentId: string) => {
    const { data } = await supabase
      .from("problems")
      .select("subject")
      .eq("user_id", studentId);
    if (data) {
      const counts: { [key: string]: number } = {};
      data.forEach((d) => {
        const subj = d.subject || "未分類";
        counts[subj] = (counts[subj] || 0) + 1;
      });
      setFolderCounts(counts);
      setAvailableFolders(Object.keys(counts).sort());
    }
  };

  const assignHomework = async () => {
    if (!targetStudent || homeworkFolders.length === 0) {
      setStatus("⚠️ フォルダを選択してください");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const records = homeworkFolders.map((f) => ({
      student_id: targetStudent.id,
      folder_name: f,
      assigned_date: today,
    }));
    const { error } = await supabase.from("homeworks").insert(records);
    if (error) setStatus("宿題設定失敗: " + error.message);
    else
      setStatus(
        `「${homeworkFolders.join(", ")}」を今日の宿題に設定しました！`
      );
  };

  const generateExportData = async () => {
    const targetId =
      isTeacherMode && targetStudent ? targetStudent.id : session.user.id;
    if (!selectedFolders.length) {
      setStatus("⚠️ フォルダを選択してください");
      return;
    }
    setStatus("集計中...");
    const { data } = await supabase
      .from("problems")
      .select("*")
      .eq("user_id", targetId)
      .in("subject", selectedFolders);
    if (!data) {
      setStatus("データなし");
      return;
    }

    const rows: ExportRow[] = [];
    const start = new Date(exportStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(exportEndDate);
    end.setHours(23, 59, 59, 999);
    let maxCols = 0;

    data.forEach((p: Problem) => {
      const filteredHistory = (p.history || []).filter((h: HistoryItem) => {
        const hDate = new Date(h.date);
        return hDate >= start && hDate <= end;
      });
      if (filteredHistory.length > 0) {
        const results = filteredHistory.map((h) => h.result);
        if (results.length > maxCols) maxCols = results.length;
        rows.push({
          lastDate: filteredHistory[filteredHistory.length - 1].date,
          subject: p.subject,
          question: p.question_text,
          answer: p.answer_text,
          results: results,
        });
      }
    });
    rows.sort(
      (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    );
    setExportData(rows);
    setMaxResultCols(maxCols);
    setStatus(`${rows.length} 件抽出`);
  };

  const startStudy = async (
    isWeakMode: boolean,
    isHomework: boolean = false
  ) => {
    const targetId = session.user.id;
    let foldersToUse = selectedFolders;

    if (isHomework) {
      if (todaysHomeworks.length === 0) {
        setStatus("今日の宿題はありません");
        return;
      }
      foldersToUse = todaysHomeworks;
    } else {
      if (foldersToUse.length === 0) {
        setStatus("⚠️ フォルダを選択してください");
        return;
      }
    }

    setStatus("準備中...");
    const now = new Date().toISOString();
    let query = supabase
      .from("problems")
      .select("*")
      .eq("user_id", targetId)
      .in("subject", foldersToUse);

    if (isWeakMode) {
      query = query.eq("is_mastered", false).lte("next_review_at", now);
      setStudyTitle(isHomework ? "🏠 今日の宿題 (特訓)" : "🔥 苦手特訓");
    } else {
      setStudyTitle(isHomework ? "🏠 今日の宿題 (全問)" : "📝 ランダム学習");
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      setStatus("問題がありません (完了しているか、対象外です)");
      return;
    }

    let sorted = data;
    if (isWeakMode) {
      const countX = (h: HistoryItem[]) =>
        h.filter((x) => x.result === "×").length;
      sorted = data.sort(
        (a, b) =>
          countX(b.history || []) - countX(a.history || []) ||
          Math.random() - 0.5
      );
    } else {
      sorted = data.sort(() => Math.random() - 0.5);
    }

    setProblems(sorted);
    setCurrentIndex(0);
    setShowAnswer(false);
    setFinished(false);
    setMode("study");
    setStatus("");
  };

  const handleResult = async (isCorrect: boolean) => {
    const current = problems[currentIndex];
    const now = new Date();
    const newHistory = [
      ...(current.history || []),
      {
        date: now.toLocaleString("ja-JP"),
        result: isCorrect ? "○" : "×",
      } as HistoryItem,
    ];
    const recent3 = newHistory.slice(-3);
    const isMastered =
      recent3.length >= 3 && recent3.every((h) => h.result === "○");
    let nextReview = now;
    if (isCorrect) nextReview.setDate(now.getDate() + 1);

    await supabase
      .from("problems")
      .update({
        history: newHistory,
        is_correct: isCorrect,
        review_count: current.review_count + 1,
        is_mastered: isMastered,
        next_review_at: nextReview.toISOString(),
      })
      .eq("id", current.id);

    if (!isCorrect)
      setProblems((prev) => [...prev, { ...current, history: newHistory }]);

    if (currentIndex + 1 < problems.length) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      setFinished(true);
    }
  };

  const copyToClipboard = () => {
    if (exportData.length === 0) return;
    let header = "最終時刻\tフォルダ\t問題\t正解";
    for (let i = 1; i <= maxResultCols; i++) header += `\t結果${i}`;
    const body = exportData
      .map(
        (r) =>
          `${r.lastDate}\t${r.subject}\t${r.question}\t${
            r.answer
          }\t${r.results.join("\t")}`
      )
      .join("\n");
    navigator.clipboard
      .writeText(header + "\n" + body)
      .then(() => alert("コピー完了"));
  };

  const toggleFolder = (folder: string) => {
    selectedFolders.includes(folder)
      ? setSelectedFolders(selectedFolders.filter((f) => f !== folder))
      : setSelectedFolders([...selectedFolders, folder]);
  };
  const toggleHomeworkFolder = (folder: string) => {
    homeworkFolders.includes(folder)
      ? setHomeworkFolders(homeworkFolders.filter((f) => f !== folder))
      : setHomeworkFolders([...homeworkFolders, folder]);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50 text-gray-800 font-sans">
      <div className="max-w-3xl mx-auto bg-white min-h-[600px] shadow-xl rounded-2xl overflow-hidden relative border border-gray-100">
        {/* ヘッダー */}
        <header
          className={`p-4 flex justify-between items-center shadow-md transition ${
            isTeacherMode ? "bg-purple-700" : "bg-indigo-600"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="text-white opacity-70 hover:opacity-100 p-1 rounded-full border border-transparent hover:border-white"
            >
              ⚙️
            </button>
            <h1 className="font-bold text-lg text-white tracking-wide">
              {isTeacherMode ? "👩‍🏫 先生モード" : "🚀 AIスパルタ学習帳"}
            </h1>
          </div>
          {session && (
            <div className="flex gap-2 md:gap-4 items-center">
              <button
                onClick={() => setMode("mypage")}
                className="text-sm bg-white/20 text-white px-3 py-1 rounded hover:bg-white/30 transition"
              >
                マイページ
              </button>
              {mode !== "menu" && mode !== "teacher" && mode !== "mypage" && (
                <button
                  onClick={() => setMode(isTeacherMode ? "teacher" : "menu")}
                  className="text-sm bg-white/20 text-white px-3 py-1 rounded hover:bg-white/30"
                >
                  メニュー
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-xs text-indigo-100 hover:text-white underline"
              >
                ログアウト
              </button>
            </div>
          )}
        </header>

        {/* 設定モーダル */}
        {showSettingsModal && (
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
        )}

        <main className="p-6">
          {!session ? (
            <div className="space-y-4 max-w-sm mx-auto mt-10">
              <h2 className="text-center font-bold text-2xl">ログイン</h2>
              <input
                className="w-full border p-3 rounded"
                type="email"
                placeholder="メール"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="w-full border p-3 rounded"
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="border-t pt-4 mt-2">
                <p className="text-xs text-gray-500 mb-1">
                  ※新規登録の方は名前を入力してください
                </p>
                <input
                  className="w-full border p-3 rounded border-blue-200 bg-blue-50"
                  type="text"
                  placeholder="名前 (生徒名)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 text-white p-3 rounded font-bold"
              >
                ログイン
              </button>
              <button
                onClick={handleSignUp}
                className="w-full text-indigo-600 text-sm"
              >
                新規登録 (名前必須)
              </button>
              <p className="text-red-500 text-center">{status}</p>
            </div>
          ) : mode === "mypage" ? (
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
              <p className="text-center font-bold text-green-600">{status}</p>
            </div>
          ) : isTeacherMode && mode === "teacher" ? (
            // --- 先生モード: 生徒一覧 ---
            <div className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-2">
                生徒を選択してください
              </h2>
              <div className="grid gap-3">
                {studentList.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => openStudentDetail(student)}
                    className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 text-left font-bold flex items-center gap-3"
                  >
                    👤{" "}
                    {student.full_name
                      ? student.full_name
                      : student.email.substring(0, 5)}
                  </button>
                ))}
                {studentList.length === 0 && (
                  <p className="text-gray-500">生徒がいません</p>
                )}
              </div>
              <button
                onClick={() => {
                  setIsTeacherMode(false);
                  setMode("menu");
                }}
                className="w-full py-3 text-gray-500 underline"
              >
                生徒モードに戻る
              </button>
            </div>
          ) : isTeacherMode && mode === "teacher_student_detail" ? (
            <div className="space-y-6">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <h3 className="font-bold text-lg text-purple-800 mb-1">
                  👤 {targetStudent?.full_name || targetStudent?.email}
                </h3>
                <p className="text-sm text-gray-600">のデータを操作中</p>
              </div>

              <div className="space-y-8">
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
                    className="w-full bg-orange-500 text-white p-3 rounded font-bold hover:bg-orange-600"
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
                    className="w-full bg-indigo-600 text-white p-2 rounded font-bold"
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

                  {/* === ここが表表示の変更箇所です === */}
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
                              {Array.from({ length: maxResultCols }).map(
                                (_, i) => (
                                  <th
                                    key={i}
                                    className="p-2 border text-center"
                                  >
                                    R{i + 1}
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {exportData.map((row, i) => (
                              <tr
                                key={i}
                                className="border-b bg-white hover:bg-gray-50"
                              >
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
                  {/* ================================== */}
                </div>
              </div>
              <p className="text-center font-bold text-green-600">{status}</p>
            </div>
          ) : mode === "menu" ? (
            <div className="space-y-6 mt-2">
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
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => startStudy(true, true)}
                      className="bg-orange-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-orange-700"
                    >
                      🔥 宿題特訓
                    </button>
                    <button
                      onClick={() => startStudy(false, true)}
                      className="bg-orange-400 text-white p-4 rounded-xl font-bold shadow hover:bg-orange-500"
                    >
                      📝 宿題全問
                    </button>
                  </div>
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
                  onClick={() => startStudy(true)}
                  disabled={selectedFolders.length === 0}
                  className="bg-blue-600 disabled:bg-gray-300 text-white p-4 rounded-xl font-bold shadow"
                >
                  🔥 苦手特訓 (自主)
                </button>
                <button
                  onClick={() => startStudy(false)}
                  disabled={selectedFolders.length === 0}
                  className="bg-blue-400 disabled:bg-gray-300 text-white p-4 rounded-xl font-bold shadow"
                >
                  📝 ランダム (自主)
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode("import")}
                  className="bg-gray-100 p-3 rounded-xl font-bold text-gray-600"
                >
                  📥 追加
                </button>
                <button
                  onClick={() => setMode("export")}
                  className="bg-gray-100 p-3 rounded-xl font-bold text-gray-600"
                >
                  📊 出力
                </button>
              </div>
            </div>
          ) : mode === "study" && !finished ? (
            // --- 学習画面 ---
            <div className="relative">
              <div className="flex justify-between items-start mb-6">
                <button
                  onClick={() => {
                    if (confirm("中断しますか？")) setMode("menu");
                  }}
                  className="text-sm bg-gray-200 px-4 py-2 rounded font-bold"
                >
                  ⏸ 休む
                </button>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600 mb-1">
                    あと {problems.length - currentIndex} 問 / 全{" "}
                    {problems.length} 問
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    {problems[currentIndex].subject}
                  </div>
                  <div className="flex gap-1 justify-end">
                    {(problems[currentIndex].history || [])
                      .slice(-5)
                      .map((h, i) => (
                        <span
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            h.result === "○" ? "bg-blue-400" : "bg-red-400"
                          }`}
                        ></span>
                      ))}
                  </div>
                </div>
              </div>
              <div className="text-center py-4">
                <p className="text-2xl font-bold py-4 min-h-[120px] flex items-center justify-center">
                  {problems[currentIndex].question_text}
                </p>
                {!showAnswer ? (
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="bg-indigo-100 text-indigo-600 px-12 py-4 rounded-full font-bold text-lg mt-8"
                  >
                    答えを見る
                  </button>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <p className="text-3xl font-bold text-red-600 mb-4">
                      {problems[currentIndex].answer_text}
                    </p>
                    <p className="text-gray-600 mb-8 bg-gray-50 p-4 rounded text-left border-l-4 border-gray-300">
                      <span className="font-bold text-xs text-gray-400 block mb-1">
                        解説
                      </span>
                      {problems[currentIndex].explanation}
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => handleResult(false)}
                        className="flex-1 bg-gray-100 text-gray-600 p-4 rounded-xl font-bold text-lg hover:bg-gray-200 border-b-4 border-gray-300 active:border-b-0 active:translate-y-1"
                      >
                        ✕ まだ...
                      </button>
                      <button
                        onClick={() => handleResult(true)}
                        className="flex-1 bg-red-500 text-white p-4 rounded-xl font-bold text-lg hover:bg-red-600 shadow-lg border-b-4 border-red-700 active:border-b-0 active:translate-y-1"
                      >
                        ◎ 覚えた!
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : mode === "import" || mode === "export" ? (
            <div className="text-center">
              <h2 className="font-bold mb-4">自主学習データの管理</h2>
              {mode === "import" && (
                <div>
                  <input
                    className="border p-2 w-full mb-2"
                    placeholder="フォルダ名"
                    value={importFolderName}
                    onChange={(e) => setImportFolderName(e.target.value)}
                  />
                  <textarea
                    className="border p-2 w-full mb-2"
                    placeholder="CSV"
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                  />
                  <button
                    onClick={handleImport}
                    className="bg-indigo-600 text-white p-2 w-full rounded font-bold"
                  >
                    保存
                  </button>
                </div>
              )}
              {mode === "export" && (
                <div>
                  <p className="mb-2">フォルダを選んで出力</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {availableFolders.map((f) => (
                      <button
                        key={f}
                        onClick={() => toggleFolder(f)}
                        className={`border px-2 ${
                          selectedFolders.includes(f)
                            ? "bg-blue-500 text-white"
                            : "bg-white"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={generateExportData}
                    className="bg-green-600 text-white p-2 w-full rounded font-bold"
                  >
                    出力
                  </button>
                  {exportData.length > 0 && (
                    <button
                      onClick={copyToClipboard}
                      className="bg-green-500 text-white p-2 w-full mt-2 rounded"
                    >
                      コピー
                    </button>
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
          ) : (
            <div className="text-center py-10">
              <h2 className="text-3xl font-bold mb-4 text-indigo-600">
                Great Job! 🎉
              </h2>
              <button
                onClick={() => setMode("menu")}
                className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow hover:bg-indigo-700"
              >
                メニューに戻る
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
