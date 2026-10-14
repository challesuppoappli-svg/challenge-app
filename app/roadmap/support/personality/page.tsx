"use client";

import {
  Suspense,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AnswerId,
  DiagnosisResult,
  PERSONALITY_QUESTIONS,
  PersonalityAnswers,
  calculatePersonalityDiagnosis,
} from "@/lib/personalityDiagnosis";

function PersonalityDiagnosisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goalId = searchParams.get("goalId");
  const currentLevel =
    searchParams.get("currentLevel");

  const [answers, setAnswers] =
    useState<PersonalityAnswers>({});

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  const [message, setMessage] = useState("");

  const currentQuestion =
    PERSONALITY_QUESTIONS[currentQuestionIndex];

  const selectedAnswer =
    answers[currentQuestion.id];

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  const isLastQuestion =
    currentQuestionIndex ===
    PERSONALITY_QUESTIONS.length - 1;

  const handleSelectAnswer = (
    answerId: AnswerId
  ) => {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [currentQuestion.id]: answerId,
    }));

    setMessage("");
  };

  const handlePrevious = () => {
    if (currentQuestionIndex === 0) {
      return;
    }

    setCurrentQuestionIndex(
      (previousIndex) => previousIndex - 1
    );

    setMessage("");
  };

  const saveDiagnosisDraft = (
    diagnosis: DiagnosisResult
  ) => {
    const roadmapDraft = {
      goalId,
      currentLevel,
      diagnosis,
    };

    sessionStorage.setItem(
      "challifyRoadmapDraft",
      JSON.stringify(roadmapDraft)
    );
  };

  const handleNext = () => {
    if (!selectedAnswer) {
      setMessage("回答を1つ選択してください。");
      return;
    }

    if (!isLastQuestion) {
      setCurrentQuestionIndex(
        (previousIndex) => previousIndex + 1
      );

      setMessage("");
      return;
    }

    const diagnosis =
      calculatePersonalityDiagnosis(answers);

    if (!diagnosis) {
      setMessage(
        "未回答の質問があります。すべての質問に回答してください。"
      );
      return;
    }

    saveDiagnosisDraft(diagnosis);

    const resultSearchParams =
      new URLSearchParams();

    if (goalId) {
      resultSearchParams.set("goalId", goalId);
    }

    if (currentLevel) {
      resultSearchParams.set(
        "currentLevel",
        currentLevel
      );
    }

    resultSearchParams.set(
      "primaryType",
      diagnosis.primaryType
    );

    if (diagnosis.secondaryType) {
      resultSearchParams.set(
        "secondaryType",
        diagnosis.secondaryType
      );
    }

    router.push(
      `/roadmap/support/result?${resultSearchParams.toString()}`
    );
  };

  if (!goalId || !currentLevel) {
    return (
      <main className="personality-page">
        <div className="personality-content">
          <p className="roadmap-support-label">
            PERSONALITY
          </p>

          <h1 className="roadmap-support-title">
            診断情報を確認できません
          </h1>

          <p className="personality-error-message">
            Goalまたは現在地の情報がありません。
            Goal選択からもう一度進めてください。
          </p>

          <button
            type="button"
            className="btn-primary personality-restart-button"
            onClick={() =>
              router.push("/roadmap/support/goals")
            }
          >
            Goal選択へ戻る
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="personality-page">
      <div className="personality-content">
        <p className="roadmap-support-label">
          PERSONALITY
        </p>

        <div className="personality-progress-header">
          <span>
            質問 {currentQuestionIndex + 1} /{" "}
            {PERSONALITY_QUESTIONS.length}
          </span>

          <span>
            回答済み {answeredCount}問
          </span>
        </div>

        <div className="personality-progress-bar">
          <div
            className="personality-progress-fill"
            style={{
              width: `${
                ((currentQuestionIndex + 1) /
                  PERSONALITY_QUESTIONS.length) *
                100
              }%`,
            }}
          />
        </div>

        <section className="personality-question-section">
          <p className="personality-question-number">
            Q{currentQuestion.id}
          </p>

          <h1 className="personality-question-title">
            {currentQuestion.question}
          </h1>

          <div className="personality-option-list">
            {currentQuestion.options.map(
              (option) => {
                const isSelected =
                  selectedAnswer === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`personality-option ${
                      isSelected
                        ? "personality-option-selected"
                        : ""
                    }`}
                    aria-pressed={isSelected}
                    onClick={() =>
                      handleSelectAnswer(option.id)
                    }
                  >
                    <span className="personality-option-letter">
                      {option.id}
                    </span>

                    <span className="personality-option-text">
                      {option.text}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </section>

        {message && (
          <p className="personality-message">
            {message}
          </p>
        )}

        <div className="personality-actions">
          <button
            type="button"
            className="personality-back-button"
            disabled={currentQuestionIndex === 0}
            onClick={handlePrevious}
          >
            戻る
          </button>

          <button
            type="button"
            className="btn-primary personality-next-button"
            disabled={!selectedAnswer}
            onClick={handleNext}
          >
            {isLastQuestion
              ? "診断結果を見る"
              : "次へ"}
          </button>
        </div>

        <p className="personality-notice">
          この診断は性格や能力を断定するものではなく、
          挑戦を続けやすいロードマップを作るために使用します。
        </p>
      </div>
    </main>
  );
}

export default function PersonalityPage() {
  return (
    <Suspense
      fallback={
        <main className="personality-page">
          <div className="personality-content">
            <p className="personality-loading">
              読み込み中...
            </p>
          </div>
        </main>
      }
    >
      <PersonalityDiagnosisContent />
    </Suspense>
  );
}