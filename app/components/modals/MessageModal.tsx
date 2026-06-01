"use client";
import { useAppContext } from "@/app/context/AppContext";

export function MessageModal() {
  const {
    showMessageModal,
    setShowMessageModal,
    messageTargetStudent,
    setMessageTargetStudent,
    messageText, setMessageText,
    sendMessage,
  } = useAppContext();

  if (!showMessageModal || !messageTargetStudent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-xl font-bold text-gray-800">
            ✉️ メッセージ送信
          </h3>
          <button
            onClick={() => {
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
  );
}
