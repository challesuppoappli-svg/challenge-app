"use client";


import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/app/components/BottomNav";
import { categoryLabels } from "@/lib/categoryLabels";


type Challenge = {
  id: string;
  title: string;
  category: string;
};

type TodayTask = {
  id: string;
  title: string;
  is_completed: boolean;
  due_date: string;
};

export default function Home() {
  const [challenge, setChallenge] =
    useState<Challenge | null>(null);

  const [todayTasks, setTodayTasks] =
    useState<TodayTask[]>([]);

  const [allTasks, setAllTasks] =
    useState<TodayTask[]>([]);

  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] =
    useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/login";
      return;
    }

    const {
      data: challengeData,
      error: challengeError,
    } = await supabase
      .from("challenges")
      .select("id, title, category,created_at")
      .eq("user_id", user.id)
     // .eq("status", "active")
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (challengeError) {
      console.error(
        "最終Goal取得エラー:",
        challengeError
      );
      setLoading(false);
      return;
    }

    if (!challengeData) {
      setChallenge(null);
      setTodayTasks([]);
      setAllTasks([]);
      setLoading(false);
      return;
    }

    setChallenge(challengeData);

    const now = new Date();

    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const {
      data: todayTasksData,
      error: todayTasksError,
    } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        due_date,
        is_completed
       
      `)
      .eq("due_date", today)
     // .eq( "goals.challenge_id", challengeData.id)
      .order("is_completed", {
        ascending: true,
      });

    if (todayTasksError) {
      console.error(
        "今日のTask取得エラー:",
        todayTasksError
      );
    }

    setTodayTasks(
      (todayTasksData ?? []) as TodayTask[]
    );

    const {
      data: allTasksData,
      error: allTasksError,
    } = await supabase
      .from("tasks")
      .select(`
        id,
        title,
        due_date,
        is_completed,
        goals!inner (
          challenge_id
        )
      `)
      .eq(
        "goals.challenge_id",
        challengeData.id
      );

    if (allTasksError) {
      console.error(
        "全Task取得エラー:",
        allTasksError
      );
      setLoading(false);
      return;
    }

    setAllTasks(
      (allTasksData ?? []) as TodayTask[]
    );

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const completedTaskCount = useMemo(
    () =>
      allTasks.filter(
        (task) => task.is_completed
      ).length,
    [allTasks]
  );

  const overallProgress =
    allTasks.length === 0
      ? 0
      : Math.round(
          (completedTaskCount /
            allTasks.length) *
            100
        );

  const todayCompletedCount = useMemo(
    () =>
      todayTasks.filter(
        (task) => task.is_completed
      ).length,
    [todayTasks]
  );

  const todayProgress =
    todayTasks.length === 0
      ? 0
      : Math.round(
          (todayCompletedCount /
            todayTasks.length) *
            100
        );

  const handleCompleteTask = async (
    task: TodayTask
  ) => {

    if (
      task.is_completed ||
      updatingTaskId
    ) {
      return;
    }

    setUpdatingTaskId(task.id);

    const { error: updateError } =
      await supabase
        .from("tasks")
        .update({
          is_completed: true,
        })

        .eq("id", task.id);

    if (updateError) {
      console.error(
        "Task更新エラー:",
        updateError
      );
      setUpdatingTaskId(null);
      return;
    }

    const { error: completionError } =
      await supabase
        .from("task_completions")
        .insert({
          task_id: task.id,
          completed_at:
            new Date().toISOString(),
        });

    if (completionError) {
      console.error(
        "完了履歴保存エラー:",
        completionError
      );
      setUpdatingTaskId(null);
      return;
    }

    await loadData();
    setUpdatingTaskId(null);
  };

  if (loading) {
    return (
      <main>
        <p>読み込み中...</p>
      </main>
    );
  }

  return (
    <main>
      <p className="section-title">
        TODAY
      </p>

      <h1 className="page-title">
        おはようございます 👋
      </h1>

      <p className="page-subtitle">
        現在の自分へ、一歩ずつ。
      </p>

      <section className="challenge-card">
        <p className="section-title">
          CURRENT GOAL
        </p>

        <div className="challenge-header">
          <h2>
            {challenge?.title ??
              "目標がありません"}
          </h2>

          {challenge && (
            <span className="badge">
              {categoryLabels[challenge.category] ??
              challenge.category}
            </span>
          )}
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${overallProgress}%`,
            }}
          />
        </div>

        <div className="progress-meta">
          <span>全体進捗</span>
          <span>{overallProgress}%</span>
        </div>
      </section>

      <section className="card">
        <p className="section-title">
          TODAY'S TASKS
        </p>

        <div className="progress-meta">
          <span>今日の進捗</span>

          <span>
            {todayCompletedCount} /{" "}
            {todayTasks.length} 完了
          </span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${todayProgress}%`,
            }}
          />
        </div>

        {todayTasks.length === 0 ? (
          <p className="page-subtitle">
            今日のTaskはありません。
          </p>

        ) : (
          <div>
            {todayTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className="task-card"
                disabled={
                  task.is_completed ||
                  updatingTaskId === task.id
                }
                onClick={() =>
                  handleCompleteTask(task)
                }
              >
                <span>
                  {task.is_completed
                    ? "✅"
                    : "⬜"}
                </span>

                <span>{task.title}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}