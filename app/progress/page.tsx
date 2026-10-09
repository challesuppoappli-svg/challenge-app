"use client";



import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/app/components/BottomNav"; 
import { categoryLabels } from "@/lib/categoryLabels";



type Task = {

  id: string;

  title: string;

  is_completed: boolean;

};



type Completion = {

  id: string;

  task_id: string;

  completed_at: string;

};



export default function ProgressPage() {

  const [challengeTitle, setChallengeTitle] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);

  const [completions, setCompletions] = useState<Completion[]>([]);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");



  useEffect(() => {

    const loadProgress = async () => {

      const {

        data: { user },

        error: userError,

      } = await supabase.auth.getUser();



      if (userError || !user) {

        window.location.href = "/login";

        return;

      }



      const { data: challenge, error: challengeError } =

        await supabase

          .from("challenges")

          .select("id, title")

          .limit(1)

          .single();



      if (challengeError) {

        console.error(challengeError);

      }



      if (challenge) {

        setChallengeTitle(challenge.title);

      }



      const { data: tasksData, error: tasksError } =

        await supabase

          .from("tasks")

          .select("id, title, is_completed");



      if (tasksError) {

        console.error(tasksError);

        setMessage(`Task取得エラー: ${tasksError.message}`);

        setLoading(false);

        return;

      }



      const taskList = tasksData ?? [];

      setTasks(taskList);



      const { data: completionsData, error: completionsError } =

        await supabase

          .from("task_completions")

          .select("id, task_id, completed_at")

          .order("completed_at", {

            ascending: false,

          });



      if (completionsError) {

        console.error(completionsError);

        setMessage(

          `達成履歴取得エラー: ${completionsError.message}`

        );

        setLoading(false);

        return;

      }



      setCompletions(completionsData ?? []);

      setLoading(false);

    };



    loadProgress();

  }, []);



  const totalTasks = tasks.length;



  const completedTasks = tasks.filter(

    (task) => task.is_completed

  ).length;



  const progress =

    totalTasks === 0

      ? 0

      : Math.round(

          (completedTasks / totalTasks) * 100

        );



  const getTaskTitle = (taskId: string) => {

    const task = tasks.find(

      (item) => item.id === taskId

    );



    return task?.title ?? "不明なTask";

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

      <h1>Progress</h1>



      <section>

        <h2>{challengeTitle || "現在の挑戦"}</h2>



        <p>{progress}%</p>



        <p>

          {completedTasks} / {totalTasks} Tasks Completed

        </p>

      </section>



      <section>

        <h2>達成履歴</h2>



        {message && <p>{message}</p>}



        {completions.length === 0 ? (

          <p>達成履歴はまだありません。</p>

        ) : (

          <ul>

            {completions.map((completion) => (

              <li key={completion.id}>

                <strong>

                  {getTaskTitle(completion.task_id)}

                </strong>



                <div>

                  {new Date(

                    completion.completed_at

                  ).toLocaleString("ja-JP")}

                </div>

              </li>

            ))}

          </ul>

        )}

      </section>

      <BottomNav/>

    </main>

  );

}