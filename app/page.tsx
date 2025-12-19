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
type Profile = {
  id: string;
  email: string;
  full_name: string;
  teacher_id?: string | null;
  invite_code?: string | null;
  is_teacher?: boolean;
  teacher_password?: string | null;
  student_limit?: number;
  has_unlimited_license?: boolean;
};

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("menu");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [inviteCode, setInviteCode] = useState(""); // 生徒登録時の招待コード入力

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
  const [importMode, setImportMode] = useState<"csv" | "manual">("csv"); // 追加: CSV or 手動入力
  const [manualQuestion, setManualQuestion] = useState(""); // 手動入力: 問題文
  const [manualAnswer, setManualAnswer] = useState(""); // 手動入力: 答え
  const [manualExplanation, setManualExplanation] = useState(""); // 手動入力: 解説
  const [manualSubject, setManualSubject] = useState(""); // 手動入力: 科目
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

  // --- 編集用 ---
  const [editProblems, setEditProblems] = useState<Problem[]>([]); // 編集用問題リスト
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null); // 編集中の問題
  const [editQuestion, setEditQuestion] = useState(""); // 編集中の問題文
  const [editAnswer, setEditAnswer] = useState(""); // 編集中の答え
  const [editExplanation, setEditExplanation] = useState(""); // 編集中の解説
  const [editSubject, setEditSubject] = useState(""); // 編集中の科目
  const [editFilterFolder, setEditFilterFolder] = useState<string>(""); // フィルタリング用フォルダ
  const [editSearchText, setEditSearchText] = useState(""); // 検索テキスト

  // --- マイページ用 ---
  const [myPageName, setMyPageName] = useState("");
  const [myPageEmail, setMyPageEmail] = useState("");
  const [myPagePassword, setMyPagePassword] = useState("");

  // --- 先生ライセンス管理用 ---
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [unlimitedLicensePassword, setUnlimitedLicensePassword] = useState("");

  // --- 問題割り当て用 ---
  const [selectedProblemIds, setSelectedProblemIds] = useState<number[]>([]);
  const [assignedProblems, setAssignedProblems] = useState<Problem[]>([]);

  // --- 学習設定用 ---
  const [studyProblemCount, setStudyProblemCount] = useState<number>(10);
  const [showStudySettings, setShowStudySettings] = useState(false);
  const [studyMode, setStudyMode] = useState<"homework" | "self">("self");
  const [studyIsWeak, setStudyIsWeak] = useState(false);
  const [studySelectedFolders, setStudySelectedFolders] = useState<string[]>([]);

  // --- 先生管理用 ---
  const [showTeacherManagement, setShowTeacherManagement] = useState(false);
  const [allTeachers, setAllTeachers] = useState<Profile[]>([]);
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherPasswordForCreation, setNewTeacherPasswordForCreation] = useState("");
  const [newTeacherStudentLimit, setNewTeacherStudentLimit] = useState(3);
  const [newTeacherUnlimited, setNewTeacherUnlimited] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Profile | null>(null);

  // --- 初期化 ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchFolders(session.user.id);
        fetchHomeworkButton(session.user.id);
        fetchUserProfile(session.user.id);
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
        fetchUserProfile(session.user.id);
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
    // student_problems 経由で問題を取得
    const { data: studentProblems } = await supabase
      .from("student_problems")
      .select("problem_id, problems(subject)")
      .eq("student_id", userId);

    if (studentProblems) {
      const counts: { [key: string]: number } = {};
      studentProblems.forEach((sp: any) => {
        if (sp.problems) {
          const subj = sp.problems.subject || "未分類";
          counts[subj] = (counts[subj] || 0) + 1;
        }
      });
      setFolderCounts(counts);
      const folders = Object.keys(counts).sort();
      setAvailableFolders(folders);
      if (selectedFolders.length === 0) setSelectedFolders(folders);
    }
  };

  // ランダムな招待コードを生成（8文字の英数字）
  const generateInviteCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // ユーザーのプロフィールを取得
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      setUserProfile(data);
      return data;
    }
    return null;
  };

  // 招待コードを生成して保存
  const createInviteCode = async (userId: string) => {
    const code = generateInviteCode();
    const { error } = await supabase
      .from("profiles")
      .update({ invite_code: code, is_teacher: true })
      .eq("id", userId);
    if (!error) {
      await fetchUserProfile(userId);
      return code;
    }
    return null;
  };

  const fetchStudents = async () => {
    if (!session) return;
    // 自分の生徒のみを取得
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("teacher_id", session.user.id);
    if (data) setStudentList(data);
  };

  const [todaysHomeworks, setTodaysHomeworks] = useState<string[]>([]);
  const fetchHomeworkButton = async (userId: string) => {
    const now = new Date();

    // 全ての宿題（過去・今日・未来）を取得
    const { data: allHomeworks } = await supabase
      .from("homeworks")
      .select("folder_name, assigned_date")
      .eq("student_id", userId)
      .order("assigned_date", { ascending: false });

    if (!allHomeworks || allHomeworks.length === 0) {
      setTodaysHomeworks([]);
      return;
    }

    // 生徒の問題を取得
    const { data: studentProblems } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", userId);

    if (!studentProblems) {
      setTodaysHomeworks([]);
      return;
    }

    const problems = studentProblems.map((sp: any) => sp.problems).filter(Boolean);

    // 未完了の宿題フォルダを抽出
    const incompleteHomeworks: string[] = [];
    const uniqueFolders = Array.from(new Set(allHomeworks.map((h) => h.folder_name)));

    for (const folderName of uniqueFolders) {
      // このフォルダの問題を取得
      const folderProblems = problems.filter((p: Problem) => p.subject === folderName);

      if (folderProblems.length === 0) continue;

      // 全ての問題が正解済み（next_review_atが未来）かチェック
      const allCompleted = folderProblems.every((p: Problem) => {
        const nextReview = new Date(p.next_review_at);
        return nextReview > now;
      });

      // 未完了なら宿題リストに追加
      if (!allCompleted) {
        incompleteHomeworks.push(folderName);
      }
    }

    setTodaysHomeworks(incompleteHomeworks);
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
    if (!inviteCode.trim()) {
      setStatus("⚠️ 先生の招待コードを入力してください");
      return;
    }

    // 招待コードの検証
    const { data: teacher, error: teacherError } = await supabase
      .from("profiles")
      .select("*")
      .eq("invite_code", inviteCode.trim().toUpperCase())
      .single();

    if (teacherError || !teacher) {
      setStatus("⚠️ 無効な招待コードです");
      return;
    }

    // 先生の生徒数をチェック
    const { data: students, error: studentsError } = await supabase
      .from("profiles")
      .select("id")
      .eq("teacher_id", teacher.id);

    if (!studentsError && students) {
      const studentCount = students.length;
      const limit = teacher.has_unlimited_license ? 9999 : (teacher.student_limit || 3);

      if (studentCount >= limit) {
        setStatus(`⚠️ この先生は生徒数の上限(${limit}人)に達しています`);
        return;
      }
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setStatus("エラー: " + error.message);
      return;
    }

    // プロフィールにteacher_idを設定
    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ teacher_id: teacher.id })
        .eq("id", authData.user.id);

      if (profileError) {
        setStatus("登録エラー: " + profileError.message);
        return;
      }
    }

    setStatus("登録完了！ログインしてください");
    setInviteCode("");
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
  const unlockSettings = async () => {
    if (!session || !userProfile) return;

    // ユーザー設定の暗証番号またはデフォルト暗証番号でチェック
    const correctPassword = userProfile.teacher_password || "soromonnoyubiwa";

    if (settingsPassword === correctPassword) {
      // 招待コードがなければ生成
      if (!userProfile.invite_code) {
        await createInviteCode(session.user.id);
      }

      setIsTeacherMode(true);
      setShowSettingsModal(false);
      setSettingsPassword("");
      fetchStudents();
      setMode("teacher");
    } else {
      alert("パスワードが違います");
    }
  };

  // 先生の暗証番号を更新
  const updateTeacherPassword = async () => {
    if (!session || !newTeacherPassword.trim()) {
      setStatus("新しい暗証番号を入力してください");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ teacher_password: newTeacherPassword.trim() })
      .eq("id", session.user.id);

    if (error) {
      setStatus("更新失敗: " + error.message);
    } else {
      setStatus("暗証番号を更新しました！");
      setNewTeacherPassword("");
      await fetchUserProfile(session.user.id);
    }
  };

  // 無制限ライセンスを有効化
  const unlockUnlimitedLicense = async () => {
    if (!session) return;

    if (unlimitedLicensePassword === "soromonnoyubiwa") {
      const { error } = await supabase
        .from("profiles")
        .update({ has_unlimited_license: true })
        .eq("id", session.user.id);

      if (error) {
        setStatus("エラー: " + error.message);
      } else {
        setStatus("✅ 無制限ライセンスを有効化しました！");
        setUnlimitedLicensePassword("");
        await fetchUserProfile(session.user.id);
        fetchStudents();
      }
    } else {
      setStatus("⚠️ 暗証番号が違います");
    }
  };

  // --- CSV保存 ---
  const saveProblemsToDB = async (
    userId: string,
    csv: string,
    folderName: string,
    autoAssign: boolean = false
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
    const { data, error } = await supabase.from("problems").insert(records).select();
    if (error) throw error;

    // 生徒自身が作成した場合、自動的に student_problems に登録
    if (autoAssign && data && data.length > 0) {
      const assignments = data.map((problem) => ({
        student_id: userId,
        problem_id: problem.id,
        assigned_by: userId,
      }));
      await supabase.from("student_problems").insert(assignments);
    }

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
        importFolderName.trim(),
        !isTeacherMode // 生徒モードの場合は自動割り当て
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

  // 手動入力の保存処理
  const handleManualAdd = async () => {
    const targetId =
      isTeacherMode && targetStudent ? targetStudent.id : session.user.id;
    if (!targetId) return;
    if (!manualQuestion.trim() || !manualAnswer.trim()) {
      setStatus("問題文と答えを入力してください");
      return;
    }
    setStatus("保存中...");
    try {
      const now = new Date().toISOString();
      const record = {
        user_id: targetId,
        question_text: manualQuestion.trim(),
        answer_text: manualAnswer.trim(),
        explanation: manualExplanation.trim() || "",
        subject: manualSubject.trim() || importFolderName.trim() || "未分類",
        is_correct: false,
        review_count: 0,
        history: [],
        next_review_at: now,
        is_mastered: false,
      };
      const { data, error } = await supabase.from("problems").insert([record]).select();
      if (error) throw error;

      // 先生モードではない場合（生徒自身が作成）、student_problemsにも登録
      if (!isTeacherMode && data && data.length > 0) {
        await supabase.from("student_problems").insert({
          student_id: targetId,
          problem_id: data[0].id,
          assigned_by: targetId,
        });
      }

      setStatus("問題を追加しました！");
      setManualQuestion("");
      setManualAnswer("");
      setManualExplanation("");
      setManualSubject("");
      if (!isTeacherMode) fetchFolders(targetId);
      else fetchTargetStudentFolders(targetId);
    } catch (error: any) {
      setStatus("保存失敗: " + error.message);
    }
  };

  // 編集モード: 問題一覧を取得
  const fetchAllProblemsForEdit = async () => {
    if (!session) return;
    setStatus("問題を読み込み中...");
    try {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .eq("user_id", session.user.id)
        .order("subject", { ascending: true })
        .order("id", { ascending: true });
      if (error) throw error;
      setEditProblems(data || []);
      setStatus(`${data?.length || 0} 件の問題を読み込みました`);
    } catch (error: any) {
      setStatus("読み込み失敗: " + error.message);
    }
  };

  // 問題を更新
  const handleUpdateProblem = async () => {
    if (!editingProblem) return;
    if (!editQuestion.trim() || !editAnswer.trim()) {
      setStatus("問題文と答えを入力してください");
      return;
    }
    setStatus("更新中...");
    try {
      const { error } = await supabase
        .from("problems")
        .update({
          question_text: editQuestion.trim(),
          answer_text: editAnswer.trim(),
          explanation: editExplanation.trim(),
          subject: editSubject.trim() || "未分類",
        })
        .eq("id", editingProblem.id);
      if (error) throw error;
      setStatus("問題を更新しました！");
      setEditingProblem(null);
      fetchAllProblemsForEdit();
      fetchFolders(session.user.id);
    } catch (error: any) {
      setStatus("更新失敗: " + error.message);
    }
  };

  // 問題を削除
  const handleDeleteProblem = async (problemId: number) => {
    if (!confirm("この問題を削除しますか？")) return;
    setStatus("削除中...");
    try {
      const { error } = await supabase
        .from("problems")
        .delete()
        .eq("id", problemId);
      if (error) throw error;
      setStatus("問題を削除しました");
      fetchAllProblemsForEdit();
      fetchFolders(session.user.id);
    } catch (error: any) {
      setStatus("削除失敗: " + error.message);
    }
  };

  // 編集を開始
  const loadEditProblems = async () => {
    if (!session?.user?.id) return;

    setStatus("読み込み中...");

    let query = supabase.from("problems").select("*");

    // 先生モードの場合、自分が作成した問題のみ
    if (isTeacherMode) {
      query = query.eq("user_id", session.user.id);
    } else {
      // 生徒モードの場合、student_problems 経由で取得
      const { data: studentProblems } = await supabase
        .from("student_problems")
        .select("problem_id, problems(*)")
        .eq("student_id", session.user.id);

      if (studentProblems) {
        const problems = studentProblems.map((sp: any) => sp.problems).filter(Boolean);

        // フィルタ適用
        let filtered = problems;
        if (editFilterFolder) {
          filtered = filtered.filter((p: Problem) => p.subject === editFilterFolder);
        }
        if (editSearchText) {
          const search = editSearchText.toLowerCase();
          filtered = filtered.filter((p: Problem) =>
            p.question_text.toLowerCase().includes(search) ||
            p.answer_text.toLowerCase().includes(search)
          );
        }

        setEditProblems(filtered);
        setStatus("");
        return;
      }
    }

    // フィルタ適用（先生モード）
    if (editFilterFolder) {
      query = query.eq("subject", editFilterFolder);
    }
    if (editSearchText) {
      query = query.or(`question_text.ilike.%${editSearchText}%,answer_text.ilike.%${editSearchText}%`);
    }

    const { data, error } = await query;
    if (error) {
      setStatus("エラー: " + error.message);
      return;
    }

    setEditProblems(data || []);
    setStatus("");
  };

  const startEditProblem = (problem: Problem) => {
    setEditingProblem(problem);
    setEditQuestion(problem.question_text);
    setEditAnswer(problem.answer_text);
    setEditExplanation(problem.explanation);
    setEditSubject(problem.subject);
  };

  // 編集をキャンセル
  const cancelEditProblem = () => {
    setEditingProblem(null);
    setEditQuestion("");
    setEditAnswer("");
    setEditExplanation("");
    setEditSubject("");
  };

  const openStudentDetail = async (student: Profile) => {
    setTargetStudent(student);
    setMode("teacher_student_detail");
    setStatus(`${student.full_name || student.email} さんのデータを編集中`);

    // 先生の問題フォルダを取得（問題割り当て用）
    if (session?.user?.id) {
      const { data } = await supabase
        .from("problems")
        .select("subject")
        .eq("user_id", session.user.id);

      if (data) {
        const counts: { [key: string]: number } = {};
        data.forEach((d) => {
          const subj = d.subject || "未分類";
          counts[subj] = (counts[subj] || 0) + 1;
        });
        setFolderCounts(counts);
        setAvailableFolders(Object.keys(counts).sort());
      }
    }

    // 割り当て済み問題をロード
    const { data: assignedData } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", student.id);

    if (assignedData) {
      const problems = assignedData.map((item: any) => item.problems);
      setAssignedProblems(problems);
    }
  };

  const fetchTargetStudentFolders = async (studentId: string) => {
    // 生徒に割り当てられた問題のフォルダを取得（宿題用）
    const { data: studentProblems } = await supabase
      .from("student_problems")
      .select("problem_id, problems(subject)")
      .eq("student_id", studentId);

    if (studentProblems) {
      const counts: { [key: string]: number } = {};
      studentProblems.forEach((sp: any) => {
        if (sp.problems) {
          const subj = sp.problems.subject || "未分類";
          counts[subj] = (counts[subj] || 0) + 1;
        }
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
    if (error) {
      setStatus("❌ 宿題の送信に失敗しました: " + error.message);
    } else {
      setStatus(
        `✅ 宿題を送信しました！「${homeworkFolders.join(", ")}」を今日の宿題に設定しました。`
      );
    }
  };

  // --- 先生管理関連 ---
  const fetchAllTeachers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_teacher", true);

    if (error) {
      console.error("先生一覧の取得エラー:", error);
      setStatus(`❌ 先生一覧の取得に失敗しました: ${error.message}`);
      setAllTeachers([]);
      return;
    }

    if (data) {
      setAllTeachers(data);
      console.log("取得した先生:", data);
    }
  };

  const createNewTeacher = async () => {
    if (!newTeacherEmail || !newTeacherName || !newTeacherPasswordForCreation) {
      setStatus("⚠️ すべての項目を入力してください");
      return;
    }

    try {
      // セッショントークンを取得
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        setStatus("❌ セッションが見つかりません");
        return;
      }

      const response = await fetch("/api/create-teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({
          email: newTeacherEmail,
          full_name: newTeacherName,
          teacher_password: newTeacherPasswordForCreation,
          student_limit: newTeacherStudentLimit,
          has_unlimited_license: newTeacherUnlimited
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus(`✅ 先生を登録しました！招待コード: ${result.teacher.invite_code}`);
        setNewTeacherEmail("");
        setNewTeacherName("");
        setNewTeacherPasswordForCreation("");
        setNewTeacherStudentLimit(3);
        setNewTeacherUnlimited(false);
        fetchAllTeachers();
      } else {
        setStatus(`❌ 登録失敗: ${result.error}`);
      }
    } catch (error: any) {
      setStatus(`❌ エラー: ${error.message}`);
    }
  };

  const updateTeacher = async (teacherId: string, updates: { student_limit?: number; has_unlimited_license?: boolean; teacher_password?: string }) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        setStatus("❌ セッションが見つかりません");
        return;
      }

      const response = await fetch("/api/update-teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({
          teacher_id: teacherId,
          ...updates
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus("✅ 先生情報を更新しました");
        fetchAllTeachers();
        setEditingTeacher(null);
      } else {
        setStatus(`❌ 更新失敗: ${result.error}`);
      }
    } catch (error: any) {
      setStatus(`❌ エラー: ${error.message}`);
    }
  };

  const openTeacherManagement = async () => {
    setShowTeacherManagement(true);
    await fetchAllTeachers();
  };

  // 問題割り当て関連
  const toggleProblemSelection = (problemId: number) => {
    setSelectedProblemIds((prev) =>
      prev.includes(problemId)
        ? prev.filter((id) => id !== problemId)
        : [...prev, problemId]
    );
  };

  const assignProblemsToStudent = async () => {
    if (!targetStudent || selectedProblemIds.length === 0) {
      setStatus("⚠️ 問題を選択してください");
      return;
    }

    const records = selectedProblemIds.map((problemId) => ({
      student_id: targetStudent.id,
      problem_id: problemId,
      assigned_by: session?.user?.id,
    }));

    const { error } = await supabase.from("student_problems").insert(records);

    if (error) {
      setStatus("割り当て失敗: " + error.message);
    } else {
      setStatus(`${selectedProblemIds.length}問を割り当てました！`);
      setSelectedProblemIds([]);
      loadAssignedProblems();
    }
  };

  const loadAssignedProblems = async () => {
    if (!targetStudent) return;

    const { data, error } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", targetStudent.id);

    if (error) {
      console.error("Error loading assigned problems:", error);
      return;
    }

    if (data) {
      const problems = data.map((item: any) => item.problems);
      setAssignedProblems(problems);
    }
  };

  const unassignProblem = async (problemId: number) => {
    if (!targetStudent) return;

    const { error } = await supabase
      .from("student_problems")
      .delete()
      .eq("student_id", targetStudent.id)
      .eq("problem_id", problemId);

    if (error) {
      setStatus("削除失敗: " + error.message);
    } else {
      setStatus("割り当てを解除しました");
      loadAssignedProblems();
    }
  };

  const deleteProblem = async (id: number) => {
    if (!confirm("この問題を削除しますか？")) return;

    const { error } = await supabase.from("problems").delete().eq("id", id);

    if (error) {
      setStatus("削除失敗: " + error.message);
    } else {
      setStatus("問題を削除しました");
      loadEditProblems();
    }
  };

  const saveEditProblem = async () => {
    if (!editingProblem) return;

    const { error } = await supabase
      .from("problems")
      .update({
        question_text: editQuestion,
        answer_text: editAnswer,
        explanation: editExplanation,
        subject: editSubject,
      })
      .eq("id", editingProblem.id);

    if (error) {
      setStatus("更新失敗: " + error.message);
    } else {
      setStatus("問題を更新しました");
      setEditingProblem(null);
      loadEditProblems();
    }
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

    // student_problems 経由で問題を取得
    const { data: studentProblems, error: spError } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", targetId);

    if (spError) {
      setStatus("問題の取得に失敗しました: " + spError.message);
      return;
    }

    // problems データを抽出
    let data = studentProblems?.map((sp: any) => sp.problems).filter(Boolean) || [];

    // フォルダでフィルタ
    data = data.filter((p: Problem) => foldersToUse.includes(p.subject));

    // 弱点モードの場合、さらにフィルタ
    if (isWeakMode) {
      data = data.filter(
        (p: Problem) =>
          !p.is_mastered && new Date(p.next_review_at) <= new Date(now)
      );
      setStudyTitle(isHomework ? "🏠 今日の宿題 (特訓)" : "🔥 苦手特訓");
    } else {
      setStudyTitle(isHomework ? "🏠 今日の宿題 (全問)" : "📝 ランダム学習");
    }

    if (data.length === 0) {
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

    // 問題数を制限（設定された数まで）
    const limitedProblems = sorted.slice(0, studyProblemCount);

    // 各問題に「今回未正解」フラグを初期化
    const problemsWithFlags = limitedProblems.map((p) => ({
      ...p,
      is_correct: false,
    }));

    setProblems(problemsWithFlags);
    setCurrentIndex(0);
    setShowAnswer(false);
    setFinished(false);
    setMode("study");
    setStatus("");
  };

  const startStudyWithSettings = () => {
    setShowStudySettings(true);
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
    let nextReview = new Date(now);
    if (isCorrect) nextReview.setDate(now.getDate() + 1);

    // データベースを更新
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

    let remainingProblems: Problem[];

    if (isCorrect) {
      // 正解した場合、この問題をリストから除外（翌日まで出題しない）
      remainingProblems = problems.filter((_, idx) => idx !== currentIndex);
    } else {
      // 不正解の場合、この問題を末尾に移動（繰り返し学習）
      const updatedCurrent = { ...current, history: newHistory };
      remainingProblems = [
        ...problems.slice(0, currentIndex),
        ...problems.slice(currentIndex + 1),
        updatedCurrent,
      ];
    }

    // 残りの問題がない場合は終了
    if (remainingProblems.length === 0) {
      setFinished(true);
      setStatus("");
      return;
    }

    // 問題リストを更新
    setProblems(remainingProblems);

    // 次のインデックスを設定
    if (currentIndex >= remainingProblems.length) {
      // 最後の問題だった場合は先頭に戻る
      setCurrentIndex(0);
    } else {
      // そのまま同じインデックス（次の問題）
      setCurrentIndex(currentIndex);
    }

    setShowAnswer(false);
    setStatus("");
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
              <div className="border-t pt-4 mt-2 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    ※新規登録の方は以下を入力してください
                  </p>
                  <input
                    className="w-full border p-3 rounded border-blue-200 bg-blue-50 mb-2"
                    type="text"
                    placeholder="名前 (生徒名)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <div>
                    <label className="text-xs font-bold text-red-600 block mb-1">
                      ⚠️ 先生の招待コード（必須）
                    </label>
                    <input
                      className="w-full border-2 p-3 rounded border-red-200 bg-red-50 font-mono uppercase"
                      type="text"
                      placeholder="例: ABC12XYZ"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      maxLength={8}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ※先生から受け取った8文字のコードを入力
                    </p>
                  </div>
                </div>
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

              {/* 先生モード管理 */}
              {isTeacherMode && userProfile && (
                <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-purple-800 border-b border-purple-200 pb-2">
                    👩‍🏫 先生モード設定
                  </h3>

                  {/* 暗証番号変更 */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      先生モード用の暗証番号を変更
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      現在の暗証番号: {userProfile.teacher_password ? "設定済み" : "デフォルト (soromonnoyubiwa)"}
                    </p>
                    <input
                      type="text"
                      className="w-full border-2 border-purple-200 p-2 rounded mb-2"
                      placeholder="新しい暗証番号"
                      value={newTeacherPassword}
                      onChange={(e) => setNewTeacherPassword(e.target.value)}
                    />
                    <button
                      onClick={updateTeacherPassword}
                      className="w-full bg-purple-600 text-white py-2 rounded font-bold hover:bg-purple-700"
                    >
                      暗証番号を更新
                    </button>
                  </div>

                  {/* 無制限ライセンス */}
                  {!userProfile.has_unlimited_license && (
                    <div className="border-t border-purple-200 pt-4">
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        🎁 無制限ライセンスを有効化
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        生徒数の上限を無制限にします
                      </p>
                      <input
                        type="password"
                        className="w-full border-2 border-green-200 p-2 rounded mb-2"
                        placeholder="ライセンスキー"
                        value={unlimitedLicensePassword}
                        onChange={(e) => setUnlimitedLicensePassword(e.target.value)}
                      />
                      <button
                        onClick={unlockUnlimitedLicense}
                        className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700"
                      >
                        ライセンスを有効化
                      </button>
                    </div>
                  )}

                  {/* ライセンス情報 */}
                  {userProfile.has_unlimited_license && (
                    <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3">
                      <p className="text-green-800 font-bold text-center">
                        ✨ 無制限ライセンスが有効です
                      </p>
                    </div>
                  )}
                </div>
              )}

              <p className="text-center font-bold text-green-600">{status}</p>
            </div>
          ) : isTeacherMode && mode === "teacher" ? (
            // --- 先生モード: 生徒一覧 ---
            <div className="space-y-6">
              <h2 className="text-xl font-bold border-b pb-2">
                生徒を選択してください
              </h2>

              {/* 招待コード表示 */}
              {userProfile?.invite_code && (
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-indigo-700 mb-1">
                        📨 あなたの招待コード
                      </p>
                      <p className="text-3xl font-bold text-indigo-600 font-mono tracking-wider">
                        {userProfile.invite_code}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        このコードを生徒に共有してください
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(userProfile.invite_code || "");
                        setStatus("📋 コピーしました！");
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700"
                    >
                      📋 コピー
                    </button>
                  </div>
                </div>
              )}

              {/* 生徒数制限表示 */}
              <div className={`rounded-xl p-4 border-2 ${
                userProfile?.has_unlimited_license
                  ? "bg-green-50 border-green-200"
                  : studentList.length >= (userProfile?.student_limit || 3)
                  ? "bg-red-50 border-red-200"
                  : "bg-gray-50 border-gray-200"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-700">
                      👥 生徒数
                    </p>
                    <p className="text-2xl font-bold">
                      {studentList.length} /{" "}
                      {userProfile?.has_unlimited_license
                        ? "無制限"
                        : userProfile?.student_limit || 3}
                      人
                    </p>
                  </div>
                  {userProfile?.has_unlimited_license && (
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                      ✨ 無制限ライセンス
                    </span>
                  )}
                </div>
              </div>

              {/* 問題管理ボタン */}
              <button
                onClick={() => setMode("teacher_problems")}
                className="w-full p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                📥 問題を追加・管理
              </button>

              {/* 先生管理ボタン（管理者のみ表示） */}
              {session?.user?.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL && (
                <button
                  onClick={openTeacherManagement}
                  className="w-full p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  🔧 先生を管理
                </button>
              )}

              {/* 先生自身のボタン */}
              {session?.user && (
                <button
                  onClick={() => {
                    // 先生自身を対象として設定
                    const teacherProfile: Profile = {
                      id: session.user.id,
                      email: session.user.email || "",
                      full_name: session.user.user_metadata?.full_name || "先生",
                      teacher_id: null,
                      invite_code: userProfile?.invite_code,
                      is_teacher: true,
                    };
                    openStudentDetail(teacherProfile);
                  }}
                  className="p-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 font-bold flex items-center gap-3 shadow-lg"
                >
                  <span className="text-2xl">👨‍🏫</span>
                  <div className="text-left flex-1">
                    <p className="text-lg">先生 ({userProfile?.full_name || "あなた"})</p>
                    <p className="text-xs opacity-90">自分の問題を管理・学習する</p>
                  </div>
                </button>
              )}

              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-gray-600 mb-3">👥 生徒一覧</h3>
              </div>

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
                  <p className="text-gray-500 text-center py-8">
                    まだ生徒がいません<br/>
                    <span className="text-sm">招待コードを共有して生徒を招待しましょう</span>
                  </p>
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

                            // そのフォルダの全問題を取得
                            const { data: problems } = await supabase
                              .from("problems")
                              .select("id")
                              .eq("user_id", session.user.id)
                              .eq("subject", f);

                            if (!problems || problems.length === 0) {
                              setStatus(`${f}に問題がありません`);
                              return;
                            }

                            // 一括割り当て
                            const records = problems.map((p) => ({
                              student_id: targetStudent.id,
                              problem_id: p.id,
                              assigned_by: session.user.id,
                            }));

                            const { error } = await supabase
                              .from("student_problems")
                              .upsert(records, {
                                onConflict: 'student_id,problem_id',
                                ignoreDuplicates: true
                              });

                            if (error) {
                              setStatus("エラー: " + error.message);
                            } else {
                              setStatus(`✅ ${f}の${problems.length}問を割り当てました！`);
                              loadAssignedProblems();
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
          ) : isTeacherMode && mode === "teacher_problems" ? (
            // --- 先生モード: 問題管理画面 ---
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
                      className="w-full bg-indigo-600 text-white p-3 rounded font-bold hover:bg-indigo-700"
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
                      className="w-full bg-indigo-600 text-white p-3 rounded font-bold hover:bg-indigo-700"
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
                      onClick={() => {
                        setStudyMode("homework");
                        setStudyIsWeak(true);
                        setStudySelectedFolders(todaysHomeworks);
                        setShowStudySettings(true);
                      }}
                      className="bg-orange-600 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-orange-700"
                    >
                      🔥 宿題特訓
                    </button>
                    <button
                      onClick={() => {
                        setStudyMode("homework");
                        setStudyIsWeak(false);
                        setStudySelectedFolders(todaysHomeworks);
                        setShowStudySettings(true);
                      }}
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
                    fetchAllProblemsForEdit();
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

              {/* 学習設定モーダル */}
              {showStudySettings && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
                    <h3 className="font-bold text-xl text-gray-800">
                      {studyMode === "homework" ? "🏠 宿題設定" : "📚 自主学習設定"}
                    </h3>

                    {/* フォルダ選択（宿題モードでは表示） */}
                    {studyMode === "homework" && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          📁 宿題のフォルダ
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {studySelectedFolders.map((f) => (
                            <button
                              key={f}
                              onClick={() => {
                                setStudySelectedFolders((prev) =>
                                  prev.includes(f)
                                    ? prev.filter((folder) => folder !== f)
                                    : [...prev, f]
                                );
                              }}
                              className={`px-3 py-1 rounded-full text-sm font-bold border ${
                                studySelectedFolders.includes(f)
                                  ? "bg-orange-500 text-white"
                                  : "bg-gray-100"
                              }`}
                            >
                              {studySelectedFolders.includes(f) ? "✓ " : ""}
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 問題数選択 */}
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
                          setShowStudySettings(false);
                          if (studyMode === "homework") {
                            selectedFolders.length = 0;
                            selectedFolders.push(...studySelectedFolders);
                            startStudy(studyIsWeak, true);
                          } else {
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

              {/* 先生管理モーダル */}
              {showTeacherManagement && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                  <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6">
                    <div className="flex justify-between items-center sticky top-0 bg-white pb-4 border-b">
                      <h3 className="font-bold text-2xl text-gray-800">
                        🔧 先生管理
                      </h3>
                      <button
                        onClick={() => setShowTeacherManagement(false)}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 新規先生登録フォーム */}
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 space-y-3">
                      <h4 className="font-bold text-lg text-orange-800">➕ 新規先生登録</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-bold mb-1">メールアドレス</label>
                          <input
                            type="email"
                            className="w-full border p-2 rounded"
                            placeholder="teacher@example.com"
                            value={newTeacherEmail}
                            onChange={(e) => setNewTeacherEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-1">名前</label>
                          <input
                            type="text"
                            className="w-full border p-2 rounded"
                            placeholder="田中太郎"
                            value={newTeacherName}
                            onChange={(e) => setNewTeacherName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-1">先生モードパスワード</label>
                          <input
                            type="text"
                            className="w-full border p-2 rounded"
                            placeholder="初期パスワード"
                            value={newTeacherPasswordForCreation}
                            onChange={(e) => setNewTeacherPasswordForCreation(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-1">生徒上限数</label>
                          <input
                            type="number"
                            className="w-full border p-2 rounded"
                            value={newTeacherStudentLimit}
                            onChange={(e) => setNewTeacherStudentLimit(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="unlimited"
                          checked={newTeacherUnlimited}
                          onChange={(e) => setNewTeacherUnlimited(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor="unlimited" className="text-sm font-bold">
                          ✨ 無制限ライセンスを付与
                        </label>
                      </div>
                      <button
                        onClick={createNewTeacher}
                        className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700"
                      >
                        ➕ 先生を登録
                      </button>
                    </div>

                    {/* 既存の先生一覧 */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-lg text-gray-800">👥 登録済みの先生</h4>
                      {allTeachers.length === 0 && (
                        <p className="text-gray-500 text-center py-8">先生が登録されていません</p>
                      )}
                      {allTeachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          className="bg-gray-50 border rounded-xl p-4 space-y-3"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">名前</p>
                              <p className="font-bold">{teacher.full_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">メールアドレス</p>
                              <p className="font-bold text-sm">{teacher.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">招待コード</p>
                              <p className="font-bold text-indigo-600">{teacher.invite_code}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">生徒上限</p>
                              <p className="font-bold">
                                {teacher.has_unlimited_license ? "✨ 無制限" : `${teacher.student_limit}人`}
                              </p>
                            </div>
                          </div>

                          {editingTeacher?.id === teacher.id ? (
                            <div className="bg-white border-2 border-indigo-200 rounded-lg p-3 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-bold mb-1">生徒上限数</label>
                                  <input
                                    type="number"
                                    className="w-full border p-2 rounded"
                                    defaultValue={teacher.student_limit}
                                    id={`limit-${teacher.id}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold mb-1">新しいパスワード</label>
                                  <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    placeholder="変更する場合のみ"
                                    id={`password-${teacher.id}`}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`unlimited-${teacher.id}`}
                                  defaultChecked={teacher.has_unlimited_license}
                                  className="w-4 h-4"
                                />
                                <label htmlFor={`unlimited-${teacher.id}`} className="text-sm font-bold">
                                  無制限ライセンス
                                </label>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingTeacher(null)}
                                  className="flex-1 bg-gray-400 text-white py-2 rounded font-bold"
                                >
                                  キャンセル
                                </button>
                                <button
                                  onClick={() => {
                                    const updates: any = {};
                                    const limitInput = document.getElementById(`limit-${teacher.id}`) as HTMLInputElement;
                                    const passwordInput = document.getElementById(`password-${teacher.id}`) as HTMLInputElement;
                                    const unlimitedCheckbox = document.getElementById(`unlimited-${teacher.id}`) as HTMLInputElement;

                                    if (limitInput) updates.student_limit = Number(limitInput.value);
                                    if (passwordInput?.value) updates.teacher_password = passwordInput.value;
                                    if (unlimitedCheckbox) updates.has_unlimited_license = unlimitedCheckbox.checked;

                                    updateTeacher(teacher.id, updates);
                                  }}
                                  className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold"
                                >
                                  更新
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingTeacher(teacher)}
                              className="w-full bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700"
                            >
                              編集
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-center font-bold text-green-600">{status}</p>
                  </div>
                </div>
              )}
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
                <p className="text-2xl font-bold py-4 min-h-[120px] flex items-center justify-center font-[family-name:var(--font-noto-serif-jp)]">
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
                    <p className="text-5xl font-bold text-red-600 mb-6 font-[family-name:var(--font-noto-serif-jp)]">
                      {problems[currentIndex].answer_text}
                    </p>
                    <p className="text-gray-600 mb-8 bg-gray-50 p-4 rounded text-left border-l-4 border-gray-300 font-[family-name:var(--font-noto-serif-jp)]">
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
          ) : mode === "edit" ? (
            // --- 編集画面 ---
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
                  // フォルダフィルタを適用
                  let filteredProblems = editProblems.filter(
                    (problem) =>
                      editFilterFolder === "" ||
                      problem.subject === editFilterFolder
                  );

                  // 検索フィルタを適用
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
          ) : mode === "import" || mode === "export" ? (
            <div className="text-center">
              <h2 className="font-bold mb-4">自主学習データの管理</h2>
              {mode === "import" && (
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
                        placeholder="問題,答え,解説,科目&#10;例: りんご,apple,果物の名前,英語&#10;例: 1+1,2,基本的な足し算,算数"
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        rows={8}
                      />
                      <button
                        onClick={handleImport}
                        className="bg-indigo-600 text-white p-3 w-full rounded font-bold hover:bg-indigo-700 transition-colors"
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
                          onChange={(e) =>
                            setManualExplanation(e.target.value)
                          }
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
                        className="bg-indigo-600 text-white p-3 w-full rounded font-bold hover:bg-indigo-700 transition-colors mt-2"
                      >
                        ➕ 問題を追加
                      </button>
                    </div>
                  )}
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
