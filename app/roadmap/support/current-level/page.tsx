"use client";

import {
  Suspense,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

const LEVELS = [1, 2, 3, 4, 5] as const;

type CurrentLevel =
  (typeof LEVELS)[number];

function CurrentLevelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goalId = searchParams.get("goalId");

  const [selectedLevel, setSelectedLevel] =
    useState<CurrentLevel | null>(null);

  const handleNext = () => {
    if (!goalId || !selectedLevel) {
      return;
    }

    const nextSearchParams =
      new URLSearchParams();

    nextSearchParams.set("goalId", goalId);

    nextSearchParams.set(
      "currentLevel",
      String(selectedLevel)
    );

    router.push(
      `/roadmap/support/personality?${nextSearchParams.toString()}`
    );
  };

  if (!goalId) {
    return (
      <main className="current-level-page">
        <div className="current-level-content">
          <p className="roadmap-support-label">
            CURRENT LEVEL
          </p>

          <h1 className="roadmap-support-title">
            Goalを確認できません
          </h1>

          <p className="current-level-error">
            選択したGoalの情報がありません。
            Goal選択からもう一度進めてください。
          </p>

          <button
            type="button"
            className="btn-primary current-level-full-button"
            onClick={() =>
              router.push(
                "/roadmap/support/goals"
              )
            }
          >
            Goal選択へ戻る
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="current-level-page">
      <div className="current-level-content">
        <p className="roadmap-support-label">
          CURRENT LEVEL
        </p>

        <h1 className="roadmap-support-title">
          現在地
        </h1>

        <p className="current-level-question">
          Goalを5とした場合、
          <br />
          現在のあなたはどの段階ですか？
        </p>

        <p className="current-level-description">
          正確な数値ではなく、
          今の感覚に近い数字を選んでください。
        </p>

        <div className="current-level-options">
          {LEVELS.map((level) => {
            const isSelected =
              selectedLevel === level;

            return (
              <button
                key={level}
                type="button"
                className={`current-level-option ${
                  isSelected
                    ? "current-level-option-selected"
                    : ""
                }`}
                aria-pressed={isSelected}
                onClick={() =>
                  setSelectedLevel(level)
                }
              >
                {level}
              </button>
            );
          })}
        </div>

        <div className="current-level-scale">
          <span>スタート地点</span>
          <span>Goal達成</span>
        </div>

        <button
          type="button"
          className="btn-primary current-level-next-button"
          disabled={!selectedLevel}
          onClick={handleNext}
        >
          次へ
        </button>
      </div>
    </main>
  );
}

export default function CurrentLevelPage() {
  return (
    <Suspense
      fallback={
        <main className="current-level-page">
          <div className="current-level-content">
            <p className="current-level-loading">
              読み込み中...
            </p>
          </div>
        </main>
      }
    >
      <CurrentLevelContent />
    </Suspense>
  );
}