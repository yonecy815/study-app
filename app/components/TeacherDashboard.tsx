"use client";
import { useAppContext } from "@/app/context/AppContext";
import { Profile } from "@/app/types";

export function TeacherDashboard() {
  const {
    session,
    setMode,
    setIsTeacherMode,
    userProfile,
    studentList,
    status, setStatus,
    openStudentDetail,
    openTeacherManagement,
    setMessageTargetStudent,
    setShowMessageModal,
    fetchAllTeachers,
    setShowTeacherManagement,
  } = useAppContext();

  return (
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
  );
}
