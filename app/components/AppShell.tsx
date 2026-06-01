"use client";
import { useAppContext } from "@/app/context/AppContext";
import { LoginView } from "@/app/components/LoginView";
import { MyPageView } from "@/app/components/MyPageView";
import { TeacherDashboard } from "@/app/components/TeacherDashboard";
import { StudentDetailView } from "@/app/components/StudentDetailView";
import { TeacherProblemsView } from "@/app/components/TeacherProblemsView";
import { StudyView } from "@/app/components/StudyView";
import { EditView } from "@/app/components/EditView";
import { ExportView } from "@/app/components/ExportView";
import { ImportView } from "@/app/components/ImportView";
import { StudentMenu } from "@/app/components/StudentMenu";
import { SettingsModal } from "@/app/components/modals/SettingsModal";
import { AdminModal } from "@/app/components/modals/AdminModal";
import { MessageModal } from "@/app/components/modals/MessageModal";

export function AppShell() {
  const {
    session,
    mode,
    setMode,
    isTeacherMode,
    isAdminMode,
    finished,
    handleLogout,
    fetchAllTeachers,
    setShowTeacherManagement,
    setShowSettingsModal,
  } = useAppContext();

  const renderMain = () => {
    if (!session) {
      return <LoginView />;
    }
    if (mode === "mypage") {
      return <MyPageView />;
    }
    if (isTeacherMode && mode === "teacher") {
      return <TeacherDashboard />;
    }
    if (isTeacherMode && mode === "teacher_student_detail") {
      return <StudentDetailView />;
    }
    if (isTeacherMode && mode === "teacher_problems") {
      return <TeacherProblemsView />;
    }
    if (mode === "study" && !finished) {
      return <StudyView />;
    }
    if (mode === "edit") {
      return <EditView />;
    }
    if (mode === "export") {
      return <ExportView />;
    }
    if (mode === "import") {
      return <ImportView />;
    }
    if (mode === "messages") {
      return <MessagesView />;
    }
    if (mode === "menu") {
      return <StudentMenu />;
    }
    // finished state or fallback
    return (
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
    );
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
        <SettingsModal />

        <main className="p-6">
          {renderMain()}
        </main>
      </div>

      {/* 先生管理モーダル */}
      <AdminModal />

      {/* メッセージ送信モーダル */}
      <MessageModal />
    </div>
  );
}

// メッセージ一覧ビュー（インライン定義）
function MessagesView() {
  const { setMode, messages } = useAppContext();

  return (
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
  );
}
