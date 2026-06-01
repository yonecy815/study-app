"use client";
import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  Problem,
  Profile,
  Message,
  ExportRow,
  HistoryItem,
  StudentProblemRow,
} from "@/app/types";

// --- ヘルパー関数 ---
export const isProblem = (p: Problem | null | undefined): p is Problem => p != null;

export const formatError = (message: string): string => {
  if (message.includes("User already registered")) return "このアカウントはすでに登録されています";
  if (message.includes("Invalid login credentials")) return "メールアドレス（または生徒名）かパスワードが正しくありません";
  if (message.includes("duplicate key")) return "すでに登録済みのデータです";
  if (message.includes("Email not confirmed")) return "メールアドレスの確認が完了していません";
  if (message.includes("fetch") || message.includes("network")) return "通信エラーが発生しました。再度お試しください";
  return message;
};

// --- Context の型定義 ---
interface AppContextValue {
  // セッション・モード
  session: Session | null;
  status: string;
  setStatus: (v: string) => void;
  mode: string;
  setMode: (v: string) => void;
  isAdminMode: boolean;
  isSubmitting: boolean;

  // 認証フォーム
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  fullName: string;
  setFullName: (v: string) => void;
  inviteCode: string;
  setInviteCode: (v: string) => void;

  // フォルダ
  availableFolders: string[];
  folderCounts: { [key: string]: number };
  selectedFolders: string[];
  setSelectedFolders: (v: string[]) => void;

  // 先生・宿題・設定
  showSettingsModal: boolean;
  setShowSettingsModal: (v: boolean) => void;
  settingsPassword: string;
  setSettingsPassword: (v: string) => void;
  isTeacherMode: boolean;
  setIsTeacherMode: (v: boolean) => void;
  studentList: Profile[];
  targetStudent: Profile | null;
  setTargetStudent: (v: Profile | null) => void;
  homeworkFolders: string[];
  setHomeworkFolders: (v: string[]) => void;

  // インポート・エクスポート・学習
  importFolderName: string;
  setImportFolderName: (v: string) => void;
  csvText: string;
  setCsvText: (v: string) => void;
  importMode: "csv" | "manual";
  setImportMode: (v: "csv" | "manual") => void;
  manualQuestion: string;
  setManualQuestion: (v: string) => void;
  manualAnswer: string;
  setManualAnswer: (v: string) => void;
  manualExplanation: string;
  setManualExplanation: (v: string) => void;
  manualSubject: string;
  setManualSubject: (v: string) => void;
  problems: Problem[];
  setProblems: (v: Problem[]) => void;
  currentIndex: number;
  setCurrentIndex: (v: number) => void;
  showAnswer: boolean;
  setShowAnswer: (v: boolean) => void;
  finished: boolean;
  setFinished: (v: boolean) => void;
  exportData: ExportRow[];
  maxResultCols: number;
  exportStartDate: string;
  setExportStartDate: (v: string) => void;
  exportEndDate: string;
  setExportEndDate: (v: string) => void;
  exportSelectedFolder: string | null;
  setExportSelectedFolder: (v: string | null) => void;
  exportFolderProblems: Problem[];
  setExportFolderProblems: (v: Problem[]) => void;
  showProgressModal: boolean;
  setShowProgressModal: (v: boolean) => void;
  progressFolder: string | null;
  setProgressFolder: (v: string | null) => void;
  progressProblems: Problem[];
  setProgressProblems: (v: Problem[]) => void;
  showMasteredModal: boolean;
  setShowMasteredModal: (v: boolean) => void;
  masteredProblems: Problem[];
  selectedMasteredIds: number[];
  setSelectedMasteredIds: Dispatch<SetStateAction<number[]>>;
  masteredFilterFolder: string;
  setMasteredFilterFolder: (v: string) => void;

  // 編集
  editProblems: Problem[];
  editingProblem: Problem | null;
  setEditingProblem: (v: Problem | null) => void;
  editQuestion: string;
  setEditQuestion: (v: string) => void;
  editAnswer: string;
  setEditAnswer: (v: string) => void;
  editExplanation: string;
  setEditExplanation: (v: string) => void;
  editSubject: string;
  setEditSubject: (v: string) => void;
  editFilterFolder: string;
  setEditFilterFolder: (v: string) => void;
  editSearchText: string;
  setEditSearchText: (v: string) => void;

  // マイページ
  myPageName: string;
  setMyPageName: (v: string) => void;
  myPageEmail: string;
  setMyPageEmail: (v: string) => void;
  myPagePassword: string;
  setMyPagePassword: (v: string) => void;

  // 先生ライセンス
  userProfile: Profile | null;
  newTeacherPassword: string;
  setNewTeacherPassword: (v: string) => void;
  unlimitedLicensePassword: string;
  setUnlimitedLicensePassword: (v: string) => void;

  // 問題割り当て
  selectedProblemIds: number[];
  setSelectedProblemIds: Dispatch<SetStateAction<number[]>>;
  assignedProblems: Problem[];

  // 学習設定
  studyProblemCount: number;
  setStudyProblemCount: (v: number) => void;
  showStudySettings: boolean;
  setShowStudySettings: (v: boolean) => void;
  studyMode: "homework" | "self";
  setStudyMode: (v: "homework" | "self") => void;
  studyIsWeak: boolean;
  setStudyIsWeak: (v: boolean) => void;
  studySelectedFolders: string[];
  setStudySelectedFolders: Dispatch<SetStateAction<string[]>>;
  useRangeSelection: boolean;
  setUseRangeSelection: (v: boolean) => void;
  rangeStart: number;
  setRangeStart: (v: number) => void;
  rangeEnd: number;
  setRangeEnd: (v: number) => void;
  isSequentialOrder: boolean;
  setIsSequentialOrder: (v: boolean) => void;

  // 先生管理
  showTeacherManagement: boolean;
  setShowTeacherManagement: (v: boolean) => void;
  allTeachers: Profile[];
  newTeacherEmail: string;
  setNewTeacherEmail: (v: string) => void;
  newTeacherName: string;
  setNewTeacherName: (v: string) => void;
  newTeacherPasswordForCreation: string;
  setNewTeacherPasswordForCreation: (v: string) => void;
  newTeacherStudentLimit: number;
  setNewTeacherStudentLimit: (v: number) => void;
  newTeacherUnlimited: boolean;
  setNewTeacherUnlimited: (v: boolean) => void;
  editingTeacher: Profile | null;
  setEditingTeacher: (v: Profile | null) => void;

  // メッセージ
  showMessageModal: boolean;
  setShowMessageModal: (v: boolean) => void;
  messageTargetStudent: Profile | null;
  setMessageTargetStudent: (v: Profile | null) => void;
  messageText: string;
  setMessageText: (v: string) => void;
  messages: Message[];
  unreadMessageCount: number;

  // 宿題
  todaysHomeworks: string[];

  // ハンドラー
  handleLogin: () => Promise<void>;
  handleSignUp: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleUpdateProfile: () => Promise<void>;
  unlockSettings: () => Promise<void>;
  updateTeacherPassword: () => Promise<void>;
  unlockUnlimitedLicense: () => Promise<void>;
  handleImport: () => Promise<void>;
  handleManualAdd: () => Promise<void>;
  handleUpdateProblem: () => Promise<void>;
  handleDeleteProblem: (problemId: number) => Promise<void>;
  loadEditProblems: () => Promise<void>;
  startEditProblem: (problem: Problem) => void;
  cancelEditProblem: () => void;
  openStudentDetail: (student: Profile) => Promise<void>;
  fetchTargetStudentFolders: (studentId: string) => Promise<void>;
  assignHomework: () => Promise<void>;
  fetchAllTeachers: () => Promise<void>;
  createNewTeacher: () => Promise<void>;
  updateTeacher: (teacherId: string, updates: { student_limit?: number; has_unlimited_license?: boolean; teacher_password?: string }) => Promise<void>;
  openTeacherManagement: () => Promise<void>;
  deleteTeacher: (teacherId: string, teacherName: string) => Promise<void>;
  newStudentPassword: string;
  setNewStudentPassword: (v: string) => void;
  resetStudentPassword: () => Promise<void>;
  toggleProblemSelection: (problemId: number) => void;
  assignProblemsToStudent: () => Promise<void>;
  loadAssignedProblems: () => Promise<void>;
  unassignProblem: (problemId: number) => Promise<void>;
  deleteProblem: (id: number) => Promise<void>;
  saveEditProblem: () => Promise<void>;
  generateExportData: () => Promise<void>;
  startStudy: (isWeakMode: boolean, isHomework?: boolean) => Promise<void>;
  handleResult: (isCorrect: boolean) => Promise<void>;
  copyToClipboard: () => void;
  toggleFolder: (folder: string) => void;
  toggleHomeworkFolder: (folder: string) => void;
  selectFolderForExport: (folder: string) => Promise<void>;
  showFolderProgress: (folder: string) => Promise<void>;
  showMasteredProblems: () => Promise<void>;
  addTriangleToMastered: () => Promise<void>;
  sendMessage: (studentId: string, text: string) => Promise<boolean | undefined>;
  fetchMessages: () => Promise<void>;
  markMessagesAsRead: () => Promise<void>;
  fetchStudents: () => Promise<void>;
  fetchFolders: (userId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("menu");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [folderCounts, setFolderCounts] = useState<{ [key: string]: number }>({});
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState("");
  const [isTeacherMode, setIsTeacherMode] = useState(false);

  const [studentList, setStudentList] = useState<Profile[]>([]);
  const [targetStudent, setTargetStudent] = useState<Profile | null>(null);
  const [homeworkFolders, setHomeworkFolders] = useState<string[]>([]);

  const [importFolderName, setImportFolderName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [importMode, setImportMode] = useState<"csv" | "manual">("csv");
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualAnswer, setManualAnswer] = useState("");
  const [manualExplanation, setManualExplanation] = useState("");
  const [manualSubject, setManualSubject] = useState("");
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
  const [exportSelectedFolder, setExportSelectedFolder] = useState<string | null>(null);
  const [exportFolderProblems, setExportFolderProblems] = useState<Problem[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressFolder, setProgressFolder] = useState<string | null>(null);
  const [progressProblems, setProgressProblems] = useState<Problem[]>([]);
  const [showMasteredModal, setShowMasteredModal] = useState(false);
  const [masteredProblems, setMasteredProblems] = useState<Problem[]>([]);
  const [selectedMasteredIds, setSelectedMasteredIds] = useState<number[]>([]);
  const [masteredFilterFolder, setMasteredFilterFolder] = useState<string>("全て");

  const [editProblems, setEditProblems] = useState<Problem[]>([]);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editExplanation, setEditExplanation] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editFilterFolder, setEditFilterFolder] = useState<string>("");
  const [editSearchText, setEditSearchText] = useState("");

  const [myPageName, setMyPageName] = useState("");
  const [myPageEmail, setMyPageEmail] = useState("");
  const [myPagePassword, setMyPagePassword] = useState("");

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [unlimitedLicensePassword, setUnlimitedLicensePassword] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");

  const [selectedProblemIds, setSelectedProblemIds] = useState<number[]>([]);
  const [assignedProblems, setAssignedProblems] = useState<Problem[]>([]);

  const [studyProblemCount, setStudyProblemCount] = useState<number>(10);
  const [showStudySettings, setShowStudySettings] = useState(false);
  const [studyMode, setStudyMode] = useState<"homework" | "self">("self");
  const [studyIsWeak, setStudyIsWeak] = useState(false);
  const [studySelectedFolders, setStudySelectedFolders] = useState<string[]>([]);
  const [useRangeSelection, setUseRangeSelection] = useState(false);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(10);
  const [isSequentialOrder, setIsSequentialOrder] = useState(false);

  const [showTeacherManagement, setShowTeacherManagement] = useState(false);
  const [allTeachers, setAllTeachers] = useState<Profile[]>([]);
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherPasswordForCreation, setNewTeacherPasswordForCreation] = useState("");
  const [newTeacherStudentLimit, setNewTeacherStudentLimit] = useState(3);
  const [newTeacherUnlimited, setNewTeacherUnlimited] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Profile | null>(null);

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageTargetStudent, setMessageTargetStudent] = useState<Profile | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const [todaysHomeworks, setTodaysHomeworks] = useState<string[]>([]);

  // --- 初期化 ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFolders = async (userId: string) => {
    const { data: studentProblems } = await supabase
      .from("student_problems")
      .select("problem_id, problems(subject)")
      .eq("student_id", userId);

    if (studentProblems) {
      const counts: { [key: string]: number } = {};
      studentProblems.forEach((sp: StudentProblemRow) => {
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

  const generateInviteCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

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
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("teacher_id", session.user.id);
    if (data) setStudentList(data);
  };

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
      setStatus("❌ メッセージの送信に失敗しました: " + formatError(error.message));
      return false;
    }
    setStatus("✅ メッセージを送信しました");
    return true;
  };

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

  const markMessagesAsRead = async () => {
    if (!session) return;
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("student_id", session.user.id)
      .eq("is_read", false);
    fetchMessages();
  };

  const fetchHomeworkButton = async (userId: string) => {
    const now = new Date();

    const { data: allHomeworks } = await supabase
      .from("homeworks")
      .select("folder_name, assigned_date")
      .eq("student_id", userId)
      .order("assigned_date", { ascending: false });

    if (!allHomeworks || allHomeworks.length === 0) {
      setTodaysHomeworks([]);
      return;
    }

    const { data: studentProblems } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", userId);

    if (!studentProblems) {
      setTodaysHomeworks([]);
      return;
    }

    const problemsList = studentProblems.map((sp: StudentProblemRow) => sp.problems).filter(isProblem);

    const incompleteHomeworks: string[] = [];
    const uniqueFolders = Array.from(new Set(allHomeworks.map((h) => h.folder_name)));

    for (const folderName of uniqueFolders) {
      const folderProblems = problemsList.filter((p: Problem) => p.subject === folderName);
      if (folderProblems.length === 0) continue;
      const allCompleted = folderProblems.every((p: Problem) => {
        const nextReview = new Date(p.next_review_at);
        return nextReview > now;
      });
      if (!allCompleted) {
        incompleteHomeworks.push(folderName);
      }
    }

    setTodaysHomeworks(incompleteHomeworks);
  };

  // --- 認証 ---
  const handleLogin = async () => {
    const isTeacher = email.includes('@') && !email.endsWith('@student.local');
    let loginEmail = email;
    if (!isTeacher) {
      loginEmail = `${email}@student.local`;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    if (error) setStatus("エラー: " + formatError(error.message));
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
    if (!/^[a-zA-Z0-9぀-ゟ゠-ヿ一-鿿_-]+$/.test(fullName.trim())) {
      setStatus("⚠️ 生徒名にスペースや @ などの記号は使用できません");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: teacher, error: teacherError } = await supabase
        .from("profiles")
        .select("*")
        .eq("invite_code", inviteCode.trim().toUpperCase())
        .single();

      if (teacherError || !teacher) {
        setStatus("⚠️ 無効な招待コードです");
        return;
      }

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

      const { data: existingStudents } = await supabase
        .from("profiles")
        .select("id")
        .eq("student_login_name", fullName)
        .limit(1);

      if (existingStudents && existingStudents.length > 0) {
        setStatus("⚠️ この生徒名は既に使用されています。別の名前を選んでください");
        return;
      }

      const studentEmail = `${fullName}@student.local`;
      const { data: authData, error } = await supabase.auth.signUp({
        email: studentEmail,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) {
        setStatus("エラー: " + formatError(error.message));
        return;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            teacher_id: teacher.id,
            student_login_name: fullName,
          })
          .eq("id", authData.user.id);

        if (profileError) {
          setStatus("登録エラー: " + profileError.message);
          return;
        }
      }

      setStatus(`✅ 登録完了！ログイン名「${fullName}」でログインしてください`);
      setInviteCode("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- マイページ更新 ---
  const handleUpdateProfile = async () => {
    if (!session) return;
    setStatus("更新中...");
    const updates: { data: { full_name: string }; email?: string; password?: string } = { data: { full_name: myPageName } };
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
    const correctPassword = userProfile.teacher_password || "testpass";
    if (settingsPassword === correctPassword) {
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
      setStatus("更新失敗: " + formatError(error.message));
    } else {
      setStatus("暗証番号を更新しました！");
      setNewTeacherPassword("");
      await fetchUserProfile(session.user.id);
    }
  };

  const unlockUnlimitedLicense = async () => {
    if (!session) return;
    if (unlimitedLicensePassword === "testpass") {
      const { error } = await supabase
        .from("profiles")
        .update({ has_unlimited_license: true })
        .eq("id", session.user.id);

      if (error) {
        setStatus("エラー: " + formatError(error.message));
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
    if (!session) return;
    const targetId = isTeacherMode && targetStudent ? targetStudent.id : session.user.id;
    if (!targetId) return;
    setIsSubmitting(true);
    setStatus("保存中...");
    try {
      const count = await saveProblemsToDB(
        targetId,
        csvText,
        importFolderName.trim(),
        !isTeacherMode
      );
      setStatus(`${count} 件の問題を保存しました！`);
      setCsvText("");
      setImportFolderName("");
      if (!isTeacherMode) fetchFolders(targetId);
      else fetchTargetStudentFolders(targetId);
    } catch (error: any) {
      setStatus("保存失敗: " + formatError(error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualAdd = async () => {
    if (!session) return;
    const targetId = isTeacherMode && targetStudent ? targetStudent.id : session.user.id;
    if (!targetId) return;
    if (!manualQuestion.trim() || !manualAnswer.trim()) {
      setStatus("問題文と答えを入力してください");
      return;
    }
    setIsSubmitting(true);
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
      setStatus("保存失敗: " + formatError(error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProblem = async () => {
    if (!session || !editingProblem) return;
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
      loadEditProblems();
      fetchFolders(session.user.id);
    } catch (error: any) {
      setStatus("更新失敗: " + formatError(error.message));
    }
  };

  const handleDeleteProblem = async (problemId: number) => {
    if (!session) return;
    if (!confirm("この問題を削除しますか？")) return;
    setStatus("削除中...");
    try {
      const { error } = await supabase
        .from("problems")
        .delete()
        .eq("id", problemId);
      if (error) throw error;
      setStatus("問題を削除しました");
      loadEditProblems();
      fetchFolders(session.user.id);
    } catch (error: any) {
      setStatus("削除失敗: " + formatError(error.message));
    }
  };

  const loadEditProblems = async () => {
    if (!session?.user?.id) return;
    setStatus("読み込み中...");

    let query = supabase.from("problems").select("*");

    if (isTeacherMode) {
      query = query.eq("user_id", session.user.id);
    } else {
      const { data: studentProblems } = await supabase
        .from("student_problems")
        .select("problem_id, problems(*)")
        .eq("student_id", session.user.id);

      if (studentProblems) {
        const problemsList = studentProblems.map((sp: StudentProblemRow) => sp.problems).filter(isProblem);
        let filtered = problemsList;
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

    if (editFilterFolder) {
      query = query.eq("subject", editFilterFolder);
    }
    if (editSearchText) {
      query = query.or(`question_text.ilike.%${editSearchText}%,answer_text.ilike.%${editSearchText}%`);
    }

    const { data, error } = await query;
    if (error) {
      setStatus("エラー: " + formatError(error.message));
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

    const { data: assignedData } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", student.id);

    if (assignedData) {
      const problemsList = assignedData.map((item: StudentProblemRow) => item.problems).filter(isProblem);
      setAssignedProblems(problemsList);
    }
  };

  const fetchTargetStudentFolders = async (studentId: string) => {
    const { data: studentProblems } = await supabase
      .from("student_problems")
      .select("problem_id, problems(subject)")
      .eq("student_id", studentId);

    if (studentProblems) {
      const counts: { [key: string]: number } = {};
      studentProblems.forEach((sp: StudentProblemRow) => {
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

    const { data: existing } = await supabase
      .from("homeworks")
      .select("folder_name")
      .eq("student_id", targetStudent.id)
      .eq("assigned_date", today);
    const existingFolders = existing?.map((h: { folder_name: string }) => h.folder_name) || [];
    const newFolders = homeworkFolders.filter((f) => !existingFolders.includes(f));

    if (newFolders.length === 0) {
      setStatus("⚠️ 選択したフォルダはすでに今日の宿題に設定済みです");
      return;
    }

    setIsSubmitting(true);
    try {
      const records = newFolders.map((f) => ({
        student_id: targetStudent.id,
        folder_name: f,
        assigned_date: today,
      }));
      const { error } = await supabase.from("homeworks").insert(records);
      if (error) {
        setStatus("❌ 宿題の送信に失敗しました: " + formatError(error.message));
      } else {
        setStatus(`✅ 宿題を送信しました！「${newFolders.join(", ")}」を今日の宿題に設定しました。`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 先生管理関連 ---
  const fetchAllTeachers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_teacher", true);

    if (error) {
      setStatus(`❌ 先生一覧の取得に失敗しました: ${formatError(error.message)}`);
      setAllTeachers([]);
      return;
    }
    if (data) {
      setAllTeachers(data);
    }
  };

  const createNewTeacher = async () => {
    if (!newTeacherEmail || !newTeacherName || !newTeacherPasswordForCreation) {
      setStatus("⚠️ すべての項目を入力してください");
      return;
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        setStatus("❌ セッションが見つかりません");
        return;
      }

      const response = await fetch("/api/create-teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          email: newTeacherEmail,
          full_name: newTeacherName,
          teacher_password: newTeacherPasswordForCreation,
          student_limit: newTeacherStudentLimit,
          has_unlimited_license: newTeacherUnlimited,
        }),
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
      setStatus(`❌ エラー: ${formatError(error.message)}`);
    }
  };

  const updateTeacher = async (
    teacherId: string,
    updates: { student_limit?: number; has_unlimited_license?: boolean; teacher_password?: string }
  ) => {
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
          "Authorization": `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({ teacher_id: teacherId, ...updates }),
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
      setStatus(`❌ エラー: ${formatError(error.message)}`);
    }
  };

  const resetStudentPassword = async () => {
    if (!session || !targetStudent) return;
    if (!newStudentPassword.trim()) { setStatus("⚠️ 新しいパスワードを入力してください"); return; }
    if (newStudentPassword.trim().length < 6) { setStatus("⚠️ パスワードは6文字以上で設定してください"); return; }
    if (!confirm(`「${targetStudent.full_name}」さんのパスワードをリセットしますか？`)) return;
    setIsSubmitting(true);
    try {
      const { data: { session: cs } } = await supabase.auth.getSession();
      if (!cs) { setStatus("❌ セッションが見つかりません"); return; }
      const res = await fetch("/api/reset-student-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cs.access_token}` },
        body: JSON.stringify({ student_id: targetStudent.id, new_password: newStudentPassword.trim() }),
      });
      const result = await res.json();
      if (res.ok && result.success) { setStatus("✅ パスワードをリセットしました"); setNewStudentPassword(""); }
      else { setStatus(`❌ ${result.error}`); }
    } catch (error: any) {
      setStatus(`❌ エラー: ${formatError(error.message)}`);
    } finally {
      setIsSubmitting(false);
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
          "Authorization": `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({ teacher_id: teacherId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus(`✅ 先生「${teacherName}」を削除しました`);
        fetchAllTeachers();
      } else {
        setStatus(`❌ 削除失敗: ${result.error}`);
      }
    } catch (error: any) {
      setStatus(`❌ エラー: ${formatError(error.message)}`);
    }
  };

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
      setStatus("割り当て失敗: " + formatError(error.message));
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

    if (error) return;

    if (data) {
      const problemsList = data.map((item: StudentProblemRow) => item.problems).filter(isProblem);
      setAssignedProblems(problemsList);
    }
  };

  const unassignProblem = async (problemId: number) => {
    if (!targetStudent) return;
    if (!confirm("この問題の割り当てを解除しますか？")) return;

    const { error } = await supabase
      .from("student_problems")
      .delete()
      .eq("student_id", targetStudent.id)
      .eq("problem_id", problemId);

    if (error) {
      setStatus("削除失敗: " + formatError(error.message));
    } else {
      setStatus("割り当てを解除しました");
      loadAssignedProblems();
    }
  };

  const deleteProblem = async (id: number) => {
    if (!confirm("この問題を削除しますか？")) return;

    const { error } = await supabase.from("problems").delete().eq("id", id);

    if (error) {
      setStatus("削除失敗: " + formatError(error.message));
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
      setStatus("更新失敗: " + formatError(error.message));
    } else {
      setStatus("問題を更新しました");
      setEditingProblem(null);
      loadEditProblems();
    }
  };

  const generateExportData = async () => {
    if (!session) return;
    const targetId = isTeacherMode && targetStudent ? targetStudent.id : session.user.id;
    if (!selectedFolders.length) {
      setStatus("⚠️ フォルダを選択してください");
      return;
    }
    setStatus("集計中...");
    const { data: studentProblems } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", targetId);
    if (!studentProblems) {
      setStatus("データなし");
      return;
    }

    const data = studentProblems
      .map((sp: StudentProblemRow) => sp.problems)
      .filter((p): p is Problem => p !== null && selectedFolders.includes(p.subject));

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

  const checkIsMastered = (history: HistoryItem[]): boolean => {
    if (!history || history.length === 0) return false;

    const dateMap = new Map<string, HistoryItem[]>();
    history.forEach((h) => {
      if (h.result === "△") return;
      const dateOnly = h.date.split(' ')[0];
      if (!dateMap.has(dateOnly)) {
        dateMap.set(dateOnly, []);
      }
      dateMap.get(dateOnly)!.push(h);
    });

    const sortedDates = Array.from(dateMap.keys()).sort();

    if (sortedDates.length >= 3) {
      const last3Dates = sortedDates.slice(-3);
      const allFirstAttemptCorrect = last3Dates.every((date) => {
        const dayHistory = dateMap.get(date)!;
        return dayHistory[0].result === "○";
      });
      if (allFirstAttemptCorrect) return true;
    }

    const lastTwo = history.slice(-2);
    if (lastTwo.length === 2 && lastTwo[0].result === "△" && lastTwo[1].result === "○") {
      return true;
    }

    return false;
  };

  const startStudy = async (isWeakMode: boolean, isHomework: boolean = false) => {
    if (!session) return;
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

    const { data: studentProblems, error: spError } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", targetId);

    if (spError) {
      setStatus("問題の取得に失敗しました: " + spError.message);
      return;
    }

    let data = studentProblems?.map((sp: StudentProblemRow) => sp.problems).filter(isProblem) || [];
    data = data.filter((p: Problem) => foldersToUse.includes(p.subject));

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
      const countX = (h: HistoryItem[]) =>
        h.filter((x) => x.result === "×").length;
      sorted = data.sort(
        (a, b) =>
          countX(b.history || []) - countX(a.history || []) ||
          Math.random() - 0.5
      );
    } else if (isSequentialOrder) {
      sorted = data.sort((a, b) => a.id - b.id);
    } else {
      sorted = data.sort(() => Math.random() - 0.5);
    }

    let limitedProblems;
    if (useRangeSelection) {
      const start = Math.max(0, rangeStart - 1);
      const end = Math.min(sorted.length, rangeEnd);
      limitedProblems = sorted.slice(start, end);

      if (rangeStart > rangeEnd) {
        setStatus("⚠️ 開始問題番号は終了問題番号以下にしてください");
        return;
      }
      if (rangeStart > sorted.length) {
        setStatus(`⚠️ 開始問題番号が範囲外です（最大: ${sorted.length}問）`);
        return;
      }
    } else {
      limitedProblems = sorted.slice(0, studyProblemCount);
    }

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

    const isMastered = checkIsMastered(newHistory);

    let nextReview = new Date(now);
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

    let remainingProblems: Problem[];

    if (isCorrect) {
      remainingProblems = problems.filter((_, idx) => idx !== currentIndex);
    } else {
      const updatedCurrent = { ...current, history: newHistory };
      remainingProblems = [
        ...problems.slice(0, currentIndex),
        ...problems.slice(currentIndex + 1),
        updatedCurrent,
      ];
    }

    if (remainingProblems.length === 0) {
      setFinished(true);
      setStatus("");
      return;
    }

    setProblems(remainingProblems);

    if (currentIndex >= remainingProblems.length) {
      setCurrentIndex(0);
    } else {
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
          `${r.lastDate}\t${r.subject}\t${r.question}\t${r.answer}\t${r.results.join("\t")}`
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

  const selectFolderForExport = async (folder: string) => {
    if (!session) return;
    setExportSelectedFolder(folder);
    setStatus("読み込み中...");

    const targetId = session.user.id;

    const { data: studentProblems, error: spError } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", targetId);

    if (spError) {
      setStatus("問題の取得に失敗しました: " + spError.message);
      return;
    }

    const allProblems = studentProblems?.map((sp: StudentProblemRow) => sp.problems).filter(isProblem) || [];
    const folderProblems = allProblems.filter((p: Problem) => p.subject === folder);

    setExportFolderProblems(folderProblems);
    setStatus("");
  };

  const showFolderProgress = async (folder: string) => {
    if (!session) return;
    setProgressFolder(folder);
    setStatus("読み込み中...");

    const targetId = session.user.id;

    const { data: studentProblems, error: spError } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", targetId);

    if (spError) {
      setStatus("問題の取得に失敗しました: " + spError.message);
      return;
    }

    const allProblems = studentProblems?.map((sp: StudentProblemRow) => sp.problems).filter(isProblem) || [];
    const folderProblems = allProblems.filter((p: Problem) => p.subject === folder);

    setProgressProblems(folderProblems);
    setShowProgressModal(true);
    setStatus("");
  };

  const showMasteredProblems = async () => {
    if (!session) return;
    if (selectedFolders.length === 0) {
      setStatus("⚠️ フォルダを選択してください");
      return;
    }

    setStatus("読み込み中...");

    const targetId = session.user.id;

    const { data: studentProblems, error: spError } = await supabase
      .from("student_problems")
      .select("problem_id, problems(*)")
      .eq("student_id", targetId);

    if (spError) {
      setStatus("問題の取得に失敗しました: " + spError.message);
      return;
    }

    const allProblems = studentProblems?.map((sp: StudentProblemRow) => sp.problems).filter(isProblem) || [];

    const mastered = allProblems.filter((p: Problem) => {
      const isInSelectedFolder = selectedFolders.includes(p.subject);
      if (!isInSelectedFolder) return false;
      return checkIsMastered(p.history || []);
    });

    setMasteredProblems(mastered);
    setSelectedMasteredIds([]);
    setMasteredFilterFolder("全て");
    setShowMasteredModal(true);
    setStatus("");
  };

  const addTriangleToMastered = async () => {
    if (!session) return;
    if (selectedMasteredIds.length === 0) {
      setStatus("⚠️ 再出題する問題を選択してください");
      return;
    }

    setStatus("処理中...");

    for (const problemId of selectedMasteredIds) {
      const problem = masteredProblems.find((p) => p.id === problemId);
      if (!problem) continue;

      const newHistory = [
        ...(problem.history || []),
        {
          date: new Date().toLocaleString("ja-JP"),
          result: "△",
        } as HistoryItem,
      ];

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
    fetchFolders(session.user.id);
  };

  const value: AppContextValue = {
    session, status, setStatus, mode, setMode, isAdminMode, isSubmitting,
    email, setEmail, password, setPassword, fullName, setFullName, inviteCode, setInviteCode,
    availableFolders, folderCounts, selectedFolders, setSelectedFolders,
    showSettingsModal, setShowSettingsModal, settingsPassword, setSettingsPassword,
    isTeacherMode, setIsTeacherMode, studentList, targetStudent, setTargetStudent,
    homeworkFolders, setHomeworkFolders,
    importFolderName, setImportFolderName, csvText, setCsvText,
    importMode, setImportMode, manualQuestion, setManualQuestion,
    manualAnswer, setManualAnswer, manualExplanation, setManualExplanation,
    manualSubject, setManualSubject, problems, setProblems, currentIndex, setCurrentIndex,
    showAnswer, setShowAnswer, finished, setFinished,
    exportData, maxResultCols, exportStartDate, setExportStartDate,
    exportEndDate, setExportEndDate, exportSelectedFolder, setExportSelectedFolder,
    exportFolderProblems, setExportFolderProblems,
    showProgressModal, setShowProgressModal, progressFolder, setProgressFolder,
    progressProblems, setProgressProblems,
    showMasteredModal, setShowMasteredModal, masteredProblems, selectedMasteredIds,
    setSelectedMasteredIds, masteredFilterFolder, setMasteredFilterFolder,
    editProblems, editingProblem, setEditingProblem, editQuestion, setEditQuestion,
    editAnswer, setEditAnswer, editExplanation, setEditExplanation,
    editSubject, setEditSubject, editFilterFolder, setEditFilterFolder,
    editSearchText, setEditSearchText,
    myPageName, setMyPageName, myPageEmail, setMyPageEmail, myPagePassword, setMyPagePassword,
    userProfile, newTeacherPassword, setNewTeacherPassword,
    unlimitedLicensePassword, setUnlimitedLicensePassword,
    selectedProblemIds, setSelectedProblemIds, assignedProblems,
    studyProblemCount, setStudyProblemCount, showStudySettings, setShowStudySettings,
    studyMode, setStudyMode, studyIsWeak, setStudyIsWeak,
    studySelectedFolders, setStudySelectedFolders,
    useRangeSelection, setUseRangeSelection, rangeStart, setRangeStart,
    rangeEnd, setRangeEnd, isSequentialOrder, setIsSequentialOrder,
    showTeacherManagement, setShowTeacherManagement, allTeachers,
    newTeacherEmail, setNewTeacherEmail, newTeacherName, setNewTeacherName,
    newTeacherPasswordForCreation, setNewTeacherPasswordForCreation,
    newTeacherStudentLimit, setNewTeacherStudentLimit,
    newTeacherUnlimited, setNewTeacherUnlimited,
    editingTeacher, setEditingTeacher,
    showMessageModal, setShowMessageModal, messageTargetStudent, setMessageTargetStudent,
    messageText, setMessageText, messages, unreadMessageCount,
    todaysHomeworks,
    handleLogin, handleSignUp, handleLogout, handleUpdateProfile,
    unlockSettings, updateTeacherPassword, unlockUnlimitedLicense,
    handleImport, handleManualAdd, handleUpdateProblem, handleDeleteProblem,
    loadEditProblems, startEditProblem, cancelEditProblem, openStudentDetail,
    fetchTargetStudentFolders, assignHomework, fetchAllTeachers, createNewTeacher,
    updateTeacher, openTeacherManagement, deleteTeacher, toggleProblemSelection,
    assignProblemsToStudent, loadAssignedProblems, unassignProblem, deleteProblem,
    saveEditProblem, generateExportData, startStudy, handleResult, copyToClipboard,
    toggleFolder, toggleHomeworkFolder, selectFolderForExport, showFolderProgress,
    showMasteredProblems, addTriangleToMastered, sendMessage, fetchMessages,
    markMessagesAsRead, fetchStudents, fetchFolders,
    newStudentPassword, setNewStudentPassword, resetStudentPassword,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
