"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/app/components/BottomNav";
import { categoryLabels } from "@/lib/categoryLabels";

type TaskData = {
  id: string;
  is_completed: boolean;
};

type GoalData = {
  id: string;
  tasks: TaskData[] | null;
};

type ChallengeData = {
  id: string;
  title: string;
  category: string;
  status: string;
  target_date: string | null;
  goals: GoalData[] | null;
};

type GoalCard = {
  id: string;
  title: string;
  category: string;
  status: string;
  targetDate: string | null;
  totalTasks: number;
  completedTasks: number;
  progress: number;
};

export default function ChallengesPage() {
  const router = useRouter();

  const [goals, setGoals] = useState<GoalCard[]>([]);
  const [message, setMessage] =
    useState("読み込み中...");

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
          category,
          status,
          target_date,
          goals (
            id,
            tasks (
              id,
              is_completed
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Goal一覧取得エラー:",
          error
        );

        setMessage(
          `取得エラー: ${error.message}`
        );

        return;
      }

      const goalCards = (
        (data ?? []) as ChallengeData[]
      ).map((challenge) => {
        const challengeTasks =
          challenge.goals?.flatMap(
            (goal) => goal.tasks ?? []
          ) ?? [];

        const totalTasks =
          challengeTasks.length;

        const completedTasks =
          challengeTasks.filter(
            (task) => task.is_completed
          ).length;
        const progress =
          totalTasks === 0
            ? 0
            : Math.round(
                (completedTasks /
                  totalTasks) *
                  100
              );

        return {
          id: challenge.id,
          title: challenge.title,
          category: challenge.category,
          status: challenge.status,
          targetDate: challenge.target_date,
          totalTasks,
          completedTasks,
          progress,
        };
      });

      setGoals(goalCards);
      setMessage("");
    };

    loadGoals();
  }, [router]);

  const getRemainingDays = (
    targetDate: string | null
  ) => {
    if (!targetDate) {
      return null;
    }

    const now = new Date();
    const target = new Date(
      `${targetDate}T00:00:00`
    );

    const difference =
      target.getTime() - now.getTime();

    return Math.max(
      0,
      Math.ceil(
        difference /
          (1000 * 60 * 60 * 24)
      )
    );
  };

  return (
    <main>
      <p className="section-title">
        GOALS
      </p>

      <h1 className="page-title">
        Goal一覧
      </h1>

      {message && <p>{message}</p>}

      {!message && goals.length === 0 && (
        <div className="card">
          <p>まだGoalがありません。</p>

          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              router.push("/challenges/new")
            }
          >
            最初のGoalを始める
          </button>
        </div>
      )}

      <div>
        {goals.map((goal) => {
          const remainingDays =
            getRemainingDays(
              goal.targetDate
            );

          return (
            <button
              key={goal.id}
              type="button"
              className="challenge-list-card"
              onClick={() =>
                router.push(
                  `/challenges/${goal.id}`
                )
              }
            >
              <div className="challenge-list-header">
                <h2>{goal.title}</h2>

                <span className="badge">
                  {
                  categoryLabels [
                    goal.category
                  ] ?? goal.category 
                }
                </span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${goal.progress}%`,
                  }}
                />
              </div>

              <div className="progress-meta">
                <span>
                  {goal.completedTasks} /{" "}
                  {goal.totalTasks} Task完了
                </span>

                <span>
                  {goal.progress}%
                </span>
              </div>

              <div className="progress-meta">
                <span>
                  {goal.status === "active"
                    ? "進行中"
                    : goal.status}
                </span>

                {remainingDays !== null && (
                  <span>
                    残り{remainingDays}日
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="challenge-create"
        onClick={() =>
          router.push("/challenges/new")
        }
      >
        ＋ 新しいGoalを作成
      </button>

      <BottomNav />
    </main>
  );
}