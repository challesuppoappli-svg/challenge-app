"use client";



import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import BottomNav from "@/app/components/BottomNav";



export default function Home() {

  const [email, setEmail] = useState("");

  const [challengeTitle, setChallengeTitle] = useState("");

  const [taskTitle, setTaskTitle] = useState("");

  const [taskId, setTaskId] = useState("");

  const [taskCompleted, setTaskCompleted] = useState(false);

  const [progress, setProgress] = useState(0);



  useEffect(() => {

    const loadData = async () => {

      const {

        data: { user },

      } = await supabase.auth.getUser();



      if (!user) {

        window.location.href = "/login";

        return;

      }



      setEmail(user.email ?? "");



      const { data: challenge, error: challengeError } =

        await supabase

          .from("challenges")

          .select("*")

          .limit(1)

          .single();



      if (challengeError) {

        console.error(challengeError);

      }



      if (challenge) {

        setChallengeTitle(challenge.title);

      }



      const { data: task, error: taskError } =

        await supabase

          .from("tasks")

          .select("*")

          .limit(1)

          .single();



      if (taskError) {

        console.error(taskError);

      }



      if (task) {

        setTaskTitle(task.title);

        setTaskId(task.id);

        setTaskCompleted(task.is_completed);

      }



      const { data: tasks, error: tasksError } =

        await supabase

          .from("tasks")

          .select("*");



      if (tasksError) {

        console.error(tasksError);

        return;

      }



      const completed =

        tasks?.filter((item) => item.is_completed).length ?? 0;



      const total = tasks?.length ?? 0;



      setProgress(

        total === 0

          ? 0

          : Math.round((completed / total) * 100)

      );

    };



    loadData();

  }, []);



  const handleCompleteTask = async () => {

  if (!taskId) {

    console.error("Task IDがありません。");

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

    console.error("完了履歴保存エラー:", completionError);

    alert(`完了履歴保存エラー: ${completionError.message}`);

    return;

  }



  window.location.reload();

};



  const handleLogout = async () => {

    await supabase.auth.signOut();

    window.location.href = "/login";

  };



  return (

    <main>

      <h1>こんにちは、{email}</h1>



      <section>

        <h2>現在の挑戦</h2>

        <p>{challengeTitle || "挑戦がありません"}</p>

      </section>



      <section>

        <h2>今日のTask</h2>



        <p>

          {taskCompleted ? "✓ " : "□ "}

          {taskTitle || "Taskがありません"}

        </p>



        {taskId && !taskCompleted && (

          <button type="button" onClick={handleCompleteTask}>

            完了にする

          </button>

        )}



        {taskCompleted && <p>完了済みです。</p>}

      </section>



      <section>

        <h2>Progress</h2>

        <p>{progress}%</p>

      </section>



      <button type="button" onClick={handleLogout}>

        ログアウト

      </button>

      <BottomNav />

    </main>

  );

}