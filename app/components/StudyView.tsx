"use client";
import { useAppContext } from "@/app/context/AppContext";

export function StudyView() {
  const {
    setMode,
    problems,
    currentIndex,
    showAnswer, setShowAnswer,
    handleResult,
  } = useAppContext();

  if (problems.length === 0 || currentIndex >= problems.length) return null;

  return (
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
  );
}
