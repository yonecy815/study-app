"use client";
import { useAppContext } from "@/app/context/AppContext";

export function AdminModal() {
  const {
    showTeacherManagement,
    setShowTeacherManagement,
    allTeachers,
    newTeacherEmail, setNewTeacherEmail,
    newTeacherName, setNewTeacherName,
    newTeacherPasswordForCreation, setNewTeacherPasswordForCreation,
    newTeacherStudentLimit, setNewTeacherStudentLimit,
    newTeacherUnlimited, setNewTeacherUnlimited,
    editingTeacher, setEditingTeacher,
    createNewTeacher,
    updateTeacher,
    deleteTeacher,
    status,
  } = useAppContext();

  if (!showTeacherManagement) return null;

  return (
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
                        const updates: { student_limit?: number; has_unlimited_license?: boolean; teacher_password?: string } = {};
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
  );
}
