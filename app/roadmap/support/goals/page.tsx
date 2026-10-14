"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ChallengeData = {
  id: string;
  title: string;
  status: string;
};

export default function RoadmapGoalSelectPage() {
  const router = useRouter();

  const [goals, setGoals] = useState<ChallengeData[]>([]);
  const [selectedGoalId, setSelectedGoalId] =
    useState<string | null>(null);
  const [message, setMessage] = useState("読み込み中...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGoals = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("challenges")
        .select(`
          id,
          title,
          status
        `)
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "AIサポート用Goal一覧取得エラー:",
          error
        );

        setMessage(`取得エラー: ${error.message}`);
        setIsLoading(false);
        return;
      }

      setGoals((data ?? []) as ChallengeData[]);
      setMessage("");
      setIsLoading(false);
    };

    loadGoals();
  }, [router]);

  const handleSelectGoal = (goalId: string) => {
    setSelectedGoalId(goalId);
  };

  const handleNext = () => {
    if (!selectedGoalId) {
      return;
    }

    router.push(
      `/roadmap/support/current-level?goalId=${encodeURIComponent(
        selectedGoalId
      )}`
    );
  };

  const handleCreateGoal = () => {
    router.push("/challenges/new");
  };

  return (
    <main className="roadmap-goal-select-page">
      <div className="roadmap-goal-select-content">
        <p className="roadmap-support-label">
          AI SUPPORT
        </p>

        <h1 className="roadmap-support-title">
          Goalを選択
        </h1>

        <p className="roadmap-support-description">
          どのGoalの計画を作りますか？
        </p>

        {message && (
          <p className="roadmap-goal-message">
            {message}
          </p>
        )}

        {!isLoading &&
          !message &&
          goals.length === 0 && (
            <div className="roadmap-goal-empty">
              <p>選択できるGoalがありません。</p>

              <button
                type="button"
                className="btn-primary roadmap-goal-create-button"
                onClick={handleCreateGoal}
              >
                Goalを作成する
              </button>
            </div>
          )}

        {!isLoading && goals.length > 0 && (
          <>
            <div className="roadmap-goal-list">
              {goals.map((goal) => {
                const isSelected =
                  selectedGoalId === goal.id;

                return (
                  <button
                    key={goal.id}
                    type="button"
                    className={`roadmap-goal-option ${
                      isSelected
                        ? "roadmap-goal-option-selected"
                        : ""
                    }`}
                    aria-pressed={isSelected}
                    onClick={() =>
                      handleSelectGoal(goal.id)
                    }
                  >
                    <span
                      className={`roadmap-goal-radio ${
                        isSelected
                          ? "roadmap-goal-radio-selected"
                          : ""
                      }`}
                      aria-hidden="true"
                    />

                    <span className="roadmap-goal-option-content">
                      <span className="roadmap-goal-option-title">
                        {goal.title}
                      </span>

                      <span className="roadmap-goal-option-status">
                        {goal.status === "active"
                          ? "進行中"
                          : goal.status}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-primary roadmap-goal-next-button"
              disabled={!selectedGoalId}
              onClick={handleNext}
            >
              次へ
            </button>
          </>
        )}
      </div>
    </main>
  );
}