"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/app/components/BottomNav";

export default function Home() {
  const [challengeTitle, setChallengeTitle] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskId, setTaskId] = useState("");
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      const {
        data: challenge,
        error: challengeError,
      } = await supabase
        .from("challenges")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (challengeError) {
        console.error("Challenge取得エラー:", challengeError);
      }

      if (challenge) {
        setChallengeTitle(challenge.title);
      }

      const {
        data: task,
        error: taskError,
      } = await supabase
        .from("tasks")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (taskError) {
        console.error("Task取得エラー:", taskError);
      }

      if (task) {
        setTaskTitle(task.title);
        setTaskId(task.id);
        setTaskCompleted(task.is_completed);
      }

      const {
        data: tasks,
        error: tasksError,
      } = await supabase
        .from("tasks")
        .select("*");

      if (tasksError) {
        console.error("Task一覧取得エラー:", tasksError);
        setLoading(false);
        return;
      }

      const completedCount =
        tasks?.filter((item) => item.is_completed).length ?? 0;
      const totalCount = tasks?.length ?? 0;
      const calculatedProgress =
        totalCount === 0
          ? 0
          : Math.round(
              (completedCount / totalCount) * 100
            );

      setProgress(calculatedProgress);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleCompleteTask = async () => {
    if (!taskId || taskCompleted) {
      return;
    }

    const { error: updateError } = await supabase
      .from("tasks")
      .update({
        is_completed: true,
      })
      .eq("id", taskId);

    if (updateError) {
      console.error("Task更新エラー:", updateError);
      return;
    }

    const { error: completionError } = await supabase
      .from("task_completions")
      .insert({
        task_id: taskId,
        completed_at: new Date().toISOString(),
      });

    if (completionError) {
      console.error(
        "完了履歴保存エラー:",
        completionError
      );

      alert(
        `完了履歴保存エラー: ${completionError.message}`
      );

      return;
    }
    window.location.reload();
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
          TODAY'S CHALLENGE
        </p>

        <div className="challenge-header">
          <h2>
            {challengeTitle || "挑戦がありません"}
          </h2>

          {challengeTitle && (
            <span className="badge">
              習慣
            </span>
          )}
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="progress-meta">
          <span>進捗率</span>
          <span>{progress}%</span>
        </div>
      </section>

      <section className="card">
        <p className="section-title">
          TODAY'S TASK
        </p>

        {taskId ? (
          <div className="task-card">
            <p>
              {taskCompleted ? "✅" : "⬜"}
              {" "}
              {taskTitle}
            </p>

            {taskCompleted ? (
              <p className="page-subtitle">
                完了済みです。
              </p>

            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={handleCompleteTask}
              >
                完了にする
              </button>
            )}
          </div>
        ) : (
          <p>今日のタスクはありません。</p>
        )}
      </section>
      <BottomNav />
    </main>
  );
}