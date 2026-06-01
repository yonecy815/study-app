"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// --- 型定義 ---
type HistoryItem = { date: string; result: "○" | "×" | "△" };
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
type Message = {
  id: number;
  teacher_id: string;
  student_id: string;
  message_text: string;
  created_at: string;
  is_read: boolean;
};

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("menu");
  const [isAdminMode, setIsAdminMode] = useState(false); // 管理者モード

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
  const [exportData, setExportData] = useState<ExportRow[]>([]);
  const [maxResultCols, setMaxResultCols] = useState(0);
  const [exportStartDate, setExportStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [exportEndDate, setExportEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [exportSelectedFolder, setExportSelectedFolder] = useState<string | null>(null); // 出力画面で選択されたフォルダ
  const [exportFolderProblems, setExportFolderProblems] = useState<Problem[]>([]); // 選択されたフォルダの問題リスト
  const [showProgressModal, setShowProgressModal] = useState(false); // 宿題選択画面から進捗確認モーダルを表示
  const [progressFolder, setProgressFolder] = useState<string | null>(null); // 進捗確認中のフォルダ
  const [progressProblems, setProgressProblems] = useState<Problem[]>([]); // 進捗確認中のフォルダの問題リスト
  const [showMasteredModal, setShowMasteredModal] = useState(false); // 殿堂入り問題モーダル
  const [masteredProblems, setMasteredProblems] = useState<Problem[]>([]); // 殿堂入り問題リスト
  const [selectedMasteredIds, setSelectedMasteredIds] = useState<number[]>([]); // 再出題選択中の問題ID
  const [masteredFilterFolder, setMasteredFilterFolder] = useState<string>("全て"); // 殿堂入り問題のフォルダフィルター

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
  const [useRangeSelection, setUseRangeSelection] = useState(false); // 範囲選択を使用するか
  const [rangeStart, setRangeStart] = useState<number>(1); // 開始問題番号
  const [rangeEnd, setRangeEnd] = useState<number>(10); // 終了問題番号
  const [isSequentialOrder, setIsSequentialOrder] = useState(false); // 順番通り出題するか（falseならランダム）

  // --- 先生管理用 ---
  const [showTeacherManagement, setShowTeacherManagement] = useState(false);
  const [allTeachers, setAllTeachers] = useState<Profile[]>([]);
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherPasswordForCreation, setNewTeacherPasswordForCreation] = useState("");
  const [newTeacherStudentLimit, setNewTeacherStudentLimit] = useState(3);
  const [newTeacherUnlimited, setNewTeacherUnlimited] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Profile | null>(null);

  // --- メッセージ機能用 ---
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTargetStudent, setMessageTargetStudent] = useState<Profile | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // --- 初期化 ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // 管理者チェック
        if (session.user.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL) {
          setIsAdminMode(true);
        }
        fetchFolders(session.user.id);
        fetchHomeworkButton(session.user.id);
        fetchUserProfile(session.user.id);
        fetchMessages();
        setMyPageName(session.user.user_metadata.full_name || "");
        setMyPageEmail(session.user.email || "");
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // 管理者チェック
        if (session.user.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL) {
          setIsAdminMode(true);
        } else {
          setIsAdminMode(false);
        }
        fetchFolders(session.user.id);
        fetchHomeworkButton(session.user.id);
        fetchUserProfile(session.user.id);
        fetchMessages();
        setMyPageName(session.user.user_metadata.full_name || "");
        setMyPageEmail(session.user.email || "");
      } else {
        setMode("menu");
        setIsTeacherMode(false);
        setIsAdminMode(false);
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
    const { data } = await supabase
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

  // メッセージを送信
  const sendMessage = async (studentId: string, text: string) => {
    if (!session || !text.trim()) return;
    const { error } = await supabase
      .from("messages")
      .insert({
        teacher_id: session.user.id,
        student_id: studentId,
        message_text: text.trim(),
      });
    if (error) {
      setStatus("❌ メッセージの送信に失敗しました: " + error.message);
      return false;
    }
    setStatus("✅ メッセージを送信しました");
    return true;
  };

  // 生徒のメッセージを取得
  const fetchMessages = async () => {
    if (!session) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("student_id", session.user.id)
      .order("created_at", { ascending: false });
    if (data) {
      setMessages(data);
      const unread = data.filter((m) => !m.is_read).length;
      setUnreadMessageCount(unread);
    }
  };

  // メッセージを既読にする
  const markMessagesAsRead = async () => {
    if (!session) return;
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("student_id", session.user.id)
      .eq("is_read", false);
    fetchMessages();
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
    // @が含まれているかで先生/生徒を判定
    const isTeacher = email.includes('@') && !email.endsWith('@student.local');
    let loginEmail = email;

    if (!isTeacher) {
      // 生徒ログイン: 生徒名から@student.localを付ける
      loginEmail = `${email}@student.local`;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
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

    // 生徒名の重複チェック
    const { data: existingStudent } = await supabase
      .from("profiles")
      .select("id")
      .eq("student_login_name", fullName)
      .single();

    if (existingStudent) {
      setStatus("⚠️ この生徒名は既に使用されています。別の名前を選んでください");
      return;
    }

    // 生徒用のメールアドレスを生成（内部用）
    const studentEmail = `${fullName}@student.local`;

    const { data: authData, error } = await supabase.auth.signUp({
      email: studentEmail,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setStatus("エラー: " + error.message);
      return;
    }

    // プロフィールにteacher_idとstudent_login_nameを設定
    if (authData.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          teacher_id: teacher.id,
          student_login_name: fullName
        })
        .eq("id", authData.user.id);

      if (profileError) {
        setStatus("登録エラー: " + profileError.message);
        return;
      }
    }

    setStatus(`登録完了！ログイン名「${fullName}」でログインしてください`);
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
    const correctPassword = userProfile.teacher_password || "testpass";

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

    if (unlimitedLicensePassword === "testpass") {
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

  const deleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!confirm(`本当に「${teacherName}」先生を削除しますか？\n\nこの操作は取り消せません。先生に紐づく生徒データも削除されます。`)) {
      return;
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        setStatus("❌ セッションが見つかりません");
        return;
      }

      const response = await fetch("/api/delete-teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({
          teacher_id: teacherId
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus(`✅ 先生「${teacherName}」を削除しました`);
        fetchAllTeachers();
      } else {
        setStatus(`❌ 削除失敗: ${result.error}`);
      }
    } catch (error: any) {
      setStatus(`❌ エラー: ${error.message}`);
    }
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
    }

    if (data.length === 0) {
      setStatus("問題がありません (完了しているか、対象外です)");
      return;
    }

    let sorted = data;
    if (isWeakMode) {
      // 弱点モード: 間違えた回数が多い順にソート
      const countX = (h: HistoryItem[]) =>
        h.filter((x) => x.result === "×").length;
      sorted = data.sort(
        (a, b) =>
          countX(b.history || []) - countX(a.history || []) ||
          Math.random() - 0.5
      );
    } else if (isSequentialOrder) {
      // 順番通りモード: ID順（データベースの順序）でソート
      sorted = data.sort((a, b) => a.id - b.id);
    } else {
      // ランダムモード: ランダムにシャッフル
      sorted = data.sort(() => Math.random() - 0.5);
    }

    // 範囲選択または問題数選択で制限
    let limitedProblems;
    if (useRangeSelection) {
      // 範囲選択の場合: 開始〜終了の範囲を取得
      // 順番通りモードの場合はソート済みの配列から範囲を取得
      const start = Math.max(0, rangeStart - 1); // 1-indexed to 0-indexed
      const end = Math.min(sorted.length, rangeEnd); // 範囲外を防ぐ
      limitedProblems = sorted.slice(start, end);

      // 範囲が無効な場合のエラーチェック
      if (rangeStart > rangeEnd) {
        setStatus("⚠️ 開始問題番号は終了問題番号以下にしてください");
        return;
      }
      if (rangeStart > sorted.length) {
        setStatus(`⚠️ 開始問題番号が範囲外です（最大: ${sorted.length}問）`);
        return;
      }
    } else {
      // 問題数選択の場合: 従来通り
      limitedProblems = sorted.slice(0, studyProblemCount);
    }

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

  // 殿堂入り判定関数
  const checkIsMastered = (history: HistoryItem[]): boolean => {
    if (!history || history.length === 0) return false;

    // 履歴を日付ごとにグループ化
    const dateMap = new Map<string, HistoryItem[]>();
    history.forEach(h => {
      if (h.result === "△") return; // △は除外
      const dateOnly = h.date.split(' ')[0]; // "2024/1/26 10:30:00" -> "2024/1/26"
      if (!dateMap.has(dateOnly)) {
        dateMap.set(dateOnly, []);
      }
      dateMap.get(dateOnly)!.push(h);
    });

    // 日付順にソート
    const sortedDates = Array.from(dateMap.keys()).sort();

    // 直近3日間をチェック
    if (sortedDates.length >= 3) {
      const last3Dates = sortedDates.slice(-3);
      const allFirstAttemptCorrect = last3Dates.every(date => {
        const dayHistory = dateMap.get(date)!;
        return dayHistory[0].result === "○"; // その日の1問目が○
      });

      if (allFirstAttemptCorrect) return true;
    }

    // △マーク後に1回で○なら再度殿堂入り
    const lastTwo = history.slice(-2);
    if (lastTwo.length === 2 && lastTwo[0].result === "△" && lastTwo[1].result === "○") {
      return true;
    }

    return false;
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

    // 殿堂入り判定（関数化したものを使用）
    const isMastered = checkIsMastered(newHistory);

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

  // フォルダを選択して問題と正誤履歴を表示
  const selectFolderForExport = async (folder: string) => {
    setExportSelectedFolder(folder);
    setStatus("読み込み中...");

    const targetId = session.user.id;

    // student_problems 経由で問題を取得
    const { data: studentProblems, error: spError } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", targetId);

    if (spError) {
      setStatus("問題の取得に失敗しました: " + spError.message);
      return;
    }

    // problems データを抽出してフォルダでフィルタ
    const allProblems = studentProblems?.map((sp: any) => sp.problems).filter(Boolean) || [];
    const folderProblems = allProblems.filter((p: Problem) => p.subject === folder);

    setExportFolderProblems(folderProblems);
    setStatus("");
  };

  // 宿題選択画面から進捗を確認
  const showFolderProgress = async (folder: string) => {
    setProgressFolder(folder);
    setStatus("読み込み中...");

    const targetId = session.user.id;

    // student_problems 経由で問題を取得
    const { data: studentProblems, error: spError } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", targetId);

    if (spError) {
      setStatus("問題の取得に失敗しました: " + spError.message);
      return;
    }

    // problems データを抽出してフォルダでフィルタ
    const allProblems = studentProblems?.map((sp: any) => sp.problems).filter(Boolean) || [];
    const folderProblems = allProblems.filter((p: Problem) => p.subject === folder);

    setProgressProblems(folderProblems);
    setShowProgressModal(true);
    setStatus("");
  };

  // 殿堂入り問題を表示
  const showMasteredProblems = async () => {
    // 選択中のフォルダがない場合はエラー
    if (selectedFolders.length === 0) {
      setStatus("⚠️ フォルダを選択してください");
      return;
    }

    setStatus("読み込み中...");

    const targetId = session.user.id;

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
    const allProblems = studentProblems?.map((sp: any) => sp.problems).filter(Boolean) || [];

    console.log("選択中のフォルダ:", selectedFolders);
    console.log("全問題数:", allProblems.length);

    // 選択中のフォルダの殿堂入り問題のみをフィルタ（クライアント側で再判定）
    const mastered = allProblems.filter((p: Problem) => {
      // 選択中のフォルダに含まれているか
      const isInSelectedFolder = selectedFolders.includes(p.subject);

      if (!isInSelectedFolder) return false;

      // 履歴から殿堂入りかどうかを判定
      const isMastered = checkIsMastered(p.history || []);

      return isMastered;
    });

    console.log("殿堂入り問題数:", mastered.length);

    setMasteredProblems(mastered);
    setSelectedMasteredIds([]);
    setMasteredFilterFolder("全て"); // フィルターをリセット
    setShowMasteredModal(true);
    setStatus("");
  };

  // 選択した殿堂入り問題に△マークを追加
  const addTriangleToMastered = async () => {
    if (selectedMasteredIds.length === 0) {
      setStatus("⚠️ 再出題する問題を選択してください");
      return;
    }

    setStatus("処理中...");

    for (const problemId of selectedMasteredIds) {
      const problem = masteredProblems.find(p => p.id === problemId);
      if (!problem) continue;

      const newHistory = [
        ...(problem.history || []),
        {
          date: new Date().toLocaleString("ja-JP"),
          result: "△",
        } as HistoryItem,
      ];

      // △マークを追加し、is_masteredをfalseに、next_review_atを現在時刻に
      await supabase
        .from("problems")
        .update({
          history: newHistory,
          is_mastered: false,
          next_review_at: new Date().toISOString(),
        })
        .eq("id", problemId);
    }

    setStatus(`✅ ${selectedMasteredIds.length}問を再出題リストに追加しました`);
    setShowMasteredModal(false);
    setSelectedMasteredIds([]);

    // フォルダ一覧を更新
    fetchFolders(session.user.id);
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
              {isAdminMode && (
                <button
                  onClick={() => {
                    fetchAllTeachers();
                    setShowTeacherManagement(true);
                  }}
                  className="text-sm bg-yellow-500 text-gray-900 px-3 py-1 rounded hover:bg-yellow-400 transition font-bold"
                >
                  🔧 先生管理
                </button>
              )}
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
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800 font-bold mb-1">
                  📌 ログイン方法
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>👨‍🏫 <strong>先生</strong>: メールアドレスを入力</li>
                  <li>👨‍🎓 <strong>生徒</strong>: 生徒名を入力（例: taro）</li>
                </ul>
              </div>
              <input
                className="w-full border p-3 rounded"
                type="text"
                placeholder="メールアドレス または 生徒名"
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
                  <p className="text-xs text-gray-500 mb-1 font-bold">
                    📝 新規登録（生徒用）
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    ※先生の登録は通常のメールアドレスで行ってください
                  </p>
                  <input
                    className="w-full border p-3 rounded border-blue-200 bg-blue-50 mb-2"
                    type="text"
                    placeholder="生徒名（ログインに使用）例: taro"
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
                className="w-full text-indigo-600 text-sm font-bold"
              >
                🎓 生徒として新規登録
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
                      現在の暗証番号: {userProfile.teacher_password ? "設定済み" : "デフォルト (testpass)"}
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
                  <div key={student.id} className="flex gap-2">
                    <button
                      onClick={() => openStudentDetail(student)}
                      className="flex-1 p-4 bg-gray-100 rounded-xl hover:bg-gray-200 text-left font-bold flex items-center gap-3"
                    >
                      👤{" "}
                      {student.full_name
                        ? student.full_name
                        : student.email.substring(0, 5)}
                    </button>
                    <button
                      onClick={() => {
                        setMessageTargetStudent(student);
                        setShowMessageModal(true);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-bold shadow-md"
                      title="メッセージを送信"
                    >
                      ✉️
                    </button>
                  </div>
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

              {/* メッセージ送信ボタン */}
              <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-300">
                <button
                  onClick={() => {
                    console.log("メッセージボタンがクリックされました");
                    console.log("targetStudent:", targetStudent);
                    if (targetStudent) {
                      console.log("モーダルを開きます");
                      setMessageTargetStudent(targetStudent);
                      setShowMessageModal(true);
                    } else {
                      console.log("targetStudentが設定されていません");
                    }
                  }}
                  className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2"
                >
                  ✉️ この生徒にメッセージを送信
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

                    {/* フォルダ選択（宿題モードではtodaysHomeworksから選択、自主学習ではselectedFoldersから選択） */}
                    {studyMode === "homework" ? (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          �� 宿題のフォルダを選択
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
                          // 範囲選択のバリデーション
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
                                  const correctCount = history.filter(h => h.result === "○").length;
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
                            {Array.from(new Set(masteredProblems.map(p => p.subject))).map(folder => {
                              const count = masteredProblems.filter(p => p.subject === folder).length;
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
                              : `（${masteredFilterFolder}: ${masteredProblems.filter(p => p.subject === masteredFilterFolder).length}問）`
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
                                  .filter(p => masteredFilterFolder === "全て" || p.subject === masteredFilterFolder)
                                  .map((problem, index) => {
                                  const history = problem.history || [];
                                  const totalAttempts = history.length;
                                  const correctCount = history.filter(h => h.result === "○").length;
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
                                            setSelectedMasteredIds(prev =>
                                              prev.includes(problem.id)
                                                ? prev.filter(id => id !== problem.id)
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
          ) : mode === "messages" ? (
            // --- メッセージ画面 ---
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">✉️ メッセージ</h2>
                <button
                  onClick={() => setMode("menu")}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-500"
                >
                  戻る
                </button>
              </div>

              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">📭</p>
                  <p>メッセージはありません</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-xl border-2 ${
                        message.is_read
                          ? "bg-white border-gray-200"
                          : "bg-blue-50 border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleString("ja-JP")}
                        </span>
                        {!message.is_read && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {message.message_text}
                      </p>
                    </div>
                  ))}
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
                                    const correctCount = history.filter(h => h.result === "○").length;
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
                                // 過去5回分の履歴を取得
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

      {/* 先生管理モーダル（最上位レベル） */}
      {showTeacherManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100] overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center sticky top-0 bg-white pb-4 border-b z-10">
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
                  id="unlimited-new"
                  checked={newTeacherUnlimited}
                  onChange={(e) => setNewTeacherUnlimited(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="unlimited-new" className="text-sm font-bold">
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingTeacher(teacher)}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => deleteTeacher(teacher.id, teacher.full_name)}
                        className="flex-1 bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700"
                      >
                        🗑️ 削除
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-center font-bold text-green-600">{status}</p>
          </div>
        </div>
      )}

      {/* メッセージ送信モーダル - 最上位レベル */}
      {showMessageModal && messageTargetStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-bold text-gray-800">
                ✉️ メッセージ送信
              </h3>
              <button
                onClick={() => {
                  console.log("モーダルを閉じます");
                  setShowMessageModal(false);
                  setMessageTargetStudent(null);
                  setMessageText("");
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                送信先: <span className="font-bold">{messageTargetStudent.full_name || messageTargetStudent.email}</span>
              </p>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="メッセージを入力してください..."
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-sm focus:border-blue-500 focus:outline-none min-h-[150px]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setMessageTargetStudent(null);
                  setMessageText("");
                }}
                className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold hover:bg-gray-500"
              >
                キャンセル
              </button>
              <button
                onClick={async () => {
                  if (messageTargetStudent) {
                    const success = await sendMessage(messageTargetStudent.id, messageText);
                    if (success) {
                      setShowMessageModal(false);
                      setMessageTargetStudent(null);
                      setMessageText("");
                    }
                  }
                }}
                disabled={!messageText.trim()}
                className="flex-1 bg-blue-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:hover:bg-gray-300"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
