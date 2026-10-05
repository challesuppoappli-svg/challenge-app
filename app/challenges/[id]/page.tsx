"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/app/components/BottomNav";


type Challenge = {
  id: string;
  title: string;
  category: string;
  start_date: string;
  target_date: string;
  description: string | null;
  status: string;
};

export default function ChallengeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [message, setMessage] = useState("読み込み中...");
  const [goalTitle, setGoalTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [goalMessage, setGoalMessage] = useState("");
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskMessage, setTaskMessage] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [reflection, setReflection] = useState("");
  const [reflectionMessage, setReflectionMessage] = useState("");
  const handleGoalSubmit = async (
  event: FormEvent<HTMLFormElement>
) => {

  event.preventDefault();
  setGoalMessage("");

  if (!goalTitle || !targetValue) {
    setGoalMessage("Goalタイトルと目標値を入力してください。");
    return;
  }

  const { error } = await supabase
    .from("goals")
    .insert({
      challenge_id: params.id,
      title: goalTitle,
      target_value: Number(targetValue),
      current_value: 0,
    });

  if (error) {
    console.error(error);
    setGoalMessage(`Goal作成エラー: ${error.message}`);
    return;
  }

  setGoalTitle("");
  setTargetValue("");
  setGoalMessage("Goalを追加しました。");
};
const handleTaskSubmit = async (
  event: FormEvent<HTMLFormElement>
) => {

  event.preventDefault();
  setTaskMessage("");

  if (
    !selectedGoalId ||
    !taskTitle ||
    !dueDate
  ) {
    setTaskMessage(
      "Goal・Taskタイトル・実施日を入力してください。"
    );
    return;
  }

  const { error } = await supabase
    .from("tasks")

    .insert({
      goal_id: selectedGoalId,
      title: taskTitle,
      description: taskDescription,
      due_date: dueDate,
      is_completed: false,
    });

  if (error) {
    console.error(error);
    setTaskMessage(
      `Task作成エラー: ${error.message}`
    );
    return;
  }

  setTaskTitle("");
  setTaskDescription("");
  setDueDate("");
  setTaskMessage(
    "Taskを追加しました。"
 );
};

const handleReflectionSubmit = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  if (!reflection) {
    setReflectionMessage(
      "振り返りを入力してください。"
    );
    return;
  }

  const { error } = await supabase
    .from("reflections")
    .insert({
      challenge_id: params.id,
      content: reflection,
    });

  if (error) {
    console.error(error);

    setReflectionMessage(
      `保存エラー: ${error.message}`
    );
    return;
  }
  setReflection("");
  setReflectionMessage(
    "振り返りを保存しました。"
  );
};

  useEffect(() => {
    const getChallenge = async () => {

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
        .select(
          "id, title, category, start_date, target_date, description, status"
        )
        .eq("id", params.id)
        .single();

      if (error) {
        console.error(error);
        setMessage(`取得エラー: ${error.message}`);
        return;
      }

     const{ data: goalsData, error:goalsError } = await supabase
       .from("goals")
       .select("*")
       .eq("challenge_id", params.id);
     if(goalsError) {
        console.error(goalsError);
        setMessage(`Goal取得エラー: ${goalsError.message}`);
        return
     }   
    
    setGoals(goalsData ?? []);

const { data: tasksData, error: tasksError } = await supabase
  .from("tasks")
  .select(`
    id,
    goal_id,
    title,
    description,
    due_date,
    is_completed,
    goals!inner (
      title,
      challenge_id
    )
  `)
  .eq("goals.challenge_id", params.id);

if (tasksError) {
  console.error(tasksError);
  setMessage(`Task取得エラー: ${tasksError.message}`);
  return;
}

setTasks(tasksData ?? []);
setChallenge(data);
setMessage("");    
    };

    getChallenge()
  }, [params.id, router]);

  if (message) {
    return (
      <main>
        <p>{message}</p>
      </main>
    );
  }

  if (!challenge) {

    return (
      <main>
        <p>挑戦が見つかりません。</p>
      </main>
    );
  }

  return (
    <main>
      <p className="section-title">
  CHALLENGE
</p>

<h1 className="page-title">
  {challenge.title}
</h1>

<div className="challenge-card">
  <div className="challenge-header">
    <h2>{challenge.title}</h2>
    <span className="badge">
      {challenge.category}
    </span>
  </div>

  <p className="page-subtitle">
    {challenge.description || "説明なし"}
  </p>
</div>

      <section className="card">
        <p className="section-title">
            GOALS
        </p>
        <h2>Goal</h2>
        <form onSubmit={handleGoalSubmit}>
          <div>
            <label htmlFor="goalTitle">Goalタイトル</label>
            <input
              id="goalTitle"
              type="text"
              value={goalTitle}
              onChange={(event) => setGoalTitle(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="targetValue">目標値</label>
            <input
              id="targetValue"
              type="number"
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary">
            Goalを追加
          </button>
          {goalMessage && (
            <p>{goalMessage}</p>
          )}
          <ul>
            {goals.map((goal) => (
                <li key={goal.id}>
                    {goal.title}
                    (目標値: {goal.target_value})
                </li>
            ))}
          </ul>
        </form>
      </section>

      <section className="card">
        <p className="section-title">
            TASKS
        </p>
  <h2>Task</h2>
  <form onSubmit={handleTaskSubmit}>
    <div>
      <label>Goal選択</label>
      <select
        value={selectedGoalId}
        onChange={(e) =>
          setSelectedGoalId(e.target.value)
        }
      >
        <option value="">
          Goalを選択
        </option>

        {goals.map((goal) => (
          <option
            key={goal.id}
            value={goal.id}
          >
            {goal.title}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label>Taskタイトル</label>
      <input
        type="text"
        value={taskTitle}
        onChange={(e) =>
          setTaskTitle(e.target.value)
        }
      />
    </div>

    <div>
      <label>説明</label>
      <textarea
        value={taskDescription}
        onChange={(e) =>
          setTaskDescription(
            e.target.value
          )
        }
      />
    </div>

    <div>
      <label>実施日</label>
      <input
        type="date"
        value={dueDate}
        onChange={(e) =>
          setDueDate(e.target.value)
        }
      />
    </div>

    <button type="submit"　className="btn-primary">
      Taskを追加
    </button>

    {taskMessage && (
      <p>{taskMessage}</p>
    )}
  </form>

  <ul>
  {tasks.map((task) => (
    <li key={task.id}>
      <strong>{task.title}</strong>

      <div>
        Goal：
        {Array.isArray(task.goals)
          ? task.goals[0]?.title
          : task.goals?.title}
      </div>

      <div>
        説明：{task.description || "なし"}
      </div>

      <div>
        実施日：{task.due_date}
      </div>

      <div>
        状態：
        {task.is_completed
          ? "完了"
          : "未完了"}
      </div>
    </li>
  ))}
</ul>

</section>

<section className="card">
    <p className="section-title">
        REFLECTION
    </p>
  <h2>Reflection</h2>
  <form onSubmit={handleReflectionSubmit}>
    <textarea
      value={reflection}
      onChange={(event) =>
        setReflection(event.target.value)
      }
      placeholder="今日どうだった？"
    />
    <button type="submit">
      保存
    </button>

    {reflectionMessage && (
      <p>{reflectionMessage}</p>
    )}
  </form>
</section>


  <section className="card">
  <p className="section-title">
    PROGRESS
  </p>

  <div className="progress-bar">
    <div
      className="progress-fill"
      style={{
        width: `${
          tasks.length === 0
            ? 0
            : Math.round(
                (
                  tasks.filter(
                    (task) =>
                      task.is_completed
                  ).length /
                  tasks.length
                ) * 100
              )
        }%`,
      }}
    />
  </div>

  <div className="progress-meta">
    <span>達成率</span>

    <span>
      {tasks.length === 0
        ? 0
        : Math.round(
            (
              tasks.filter(
                (task) =>
                  task.is_completed
              ).length /
              tasks.length
            ) * 100
          )}
      %
    </span>
  </div>
</section>

  <p>
    Goal数: {goals.length}
  </p>

  <p>
    Task数: {tasks.length}
  </p>

  <p>
    完了率:
    {" "}
    {tasks.length === 0
      ? 0
      : Math.round(
          (tasks.filter(
            (task) => task.is_completed
          ).length /
            tasks.length) *
            100
        )}
    %
  </p>
  <BottomNav />
</main> 
  );
}