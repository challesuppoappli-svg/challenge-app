"use client";



import {

  useEffect,

  useState,

} from "react";

import {

  useParams,

  useRouter,

} from "next/navigation";

import { supabase } from "@/lib/supabase";

import BottomNav from "@/app/components/BottomNav";



type MilestoneData = {

  id: string;

  roadmap_id: string;

  step_order: number;

  title: string;

  description: string | null;

  is_completed: boolean;

};



type RoadmapData = {

  challenge_id: string;

};



type GoalData = {

  id: string;

};



type GeneratedTaskDraft = {

  title: string;

  description: string;

  dueDateOffset: number;

};



const formatDate = (date: Date) => {

  const year = date.getFullYear();



  const month = String(

    date.getMonth() + 1

  ).padStart(2, "0");



  const day = String(

    date.getDate()

  ).padStart(2, "0");



  return `${year}-${month}-${day}`;

};



const createDueDate = (

  offsetDays: number

) => {

  const date = new Date();



  date.setHours(12, 0, 0, 0);



  date.setDate(

    date.getDate() + offsetDays

  );



  return formatDate(date);

};



const createTaskDrafts = (

  milestone: MilestoneData

): GeneratedTaskDraft[] => {

  return [

    {

      title: `${milestone.title}の現状を整理する`,

      description:

        "現在できていること、足りないこと、必要な情報を整理します。",

      dueDateOffset: 0,

    },

    {

      title: `${milestone.title}を実行する`,

      description:

        milestone.description ??

        "このMilestoneの中心となる行動を実行します。",

      dueDateOffset: 3,

    },

    {

      title: `${milestone.title}の結果を振り返る`,

      description:

        "実行結果を確認し、次のステップに向けた改善点を整理します。",

      dueDateOffset: 7,

    },

  ];

};



export default function MilestoneDetailPage() {

  const router = useRouter();



  const params = useParams<{

    id: string;

  }>();



  const milestoneId = params.id;



  const [milestone, setMilestone] =

    useState<MilestoneData | null>(null);



  const [isLoading, setIsLoading] =

    useState(true);



  const [isUpdating, setIsUpdating] =

    useState(false);



  const [isGeneratingTasks, setIsGeneratingTasks] =

    useState(false);



  const [hasGeneratedTasks, setHasGeneratedTasks] =

    useState(false);



  const [generatedTaskCount, setGeneratedTaskCount] =

    useState(0);

  const [challengeId, setChallengeId] =

  useState<string | null>(null);  



  const [message, setMessage] =

    useState("");



  useEffect(() => {

    const loadMilestone = async () => {

      setIsLoading(true);

      setMessage("");



      const {

        data: { user },

        error: userError,

      } = await supabase.auth.getUser();



      if (userError || !user) {

        router.push("/login");

        return;

      }



      if (!milestoneId) {

        setMessage(

          "Milestone IDを確認できませんでした。"

        );



        setIsLoading(false);

        return;

      }



      const {

        data,

        error,

      } = await supabase

        .from("milestones")

        .select(`

          id,

          roadmap_id,

          step_order,

          title,

          description,

          is_completed

        `)

        .eq("id", milestoneId)

        .maybeSingle();



      if (error) {

        console.error(

          "Milestone詳細取得エラー:",

          error

        );



        setMessage(

          `Milestone取得エラー: ${error.message}`

        );



        setIsLoading(false);

        return;

      }



      if (!data) {

        setMessage(

          "Milestoneが見つかりませんでした。"

        );



        setIsLoading(false);

        return;

      }



      const resolvedMilestone =

        data as MilestoneData;



      setMilestone(resolvedMilestone);

      const {

  data: roadmapData,

  error: roadmapError,

} = await supabase

  .from("roadmaps")

  .select("challenge_id")

  .eq(

    "id",

    resolvedMilestone.roadmap_id

  )

  .eq("user_id", user.id)

  .maybeSingle();



if (roadmapError) {

  console.error(

    "Milestone用Roadmap取得エラー:",

    roadmapError

  );



  setMessage(

    `Roadmap取得エラー: ${roadmapError.message}`

  );

} else {

  setChallengeId(

    roadmapData?.challenge_id ?? null

  );

}



      const {

        count,

        error: taskCountError,

      } = await supabase

        .from("tasks")

        .select("id", {

          count: "exact",

          head: true,

        })

        .eq(

          "milestone_id",

          resolvedMilestone.id

        );



      if (taskCountError) {

        console.error(

          "生成済みTask確認エラー:",

          taskCountError

        );



        setMessage(

          `Task確認エラー: ${taskCountError.message}`

        );

      } else {

        const taskCount = count ?? 0;



        setGeneratedTaskCount(taskCount);

        setHasGeneratedTasks(

          taskCount > 0

        );

      }



      setIsLoading(false);

    };



    loadMilestone();

  }, [milestoneId, router]);



  const handleToggleCompleted = async () => {

    if (!milestone || isUpdating) {

      return;

    }



    setIsUpdating(true);

    setMessage("");



    const nextCompletedState =

      !milestone.is_completed;



    const {

      data,

      error,

    } = await supabase

      .from("milestones")

      .update({

        is_completed:

          nextCompletedState,

      })

      .eq("id", milestone.id)

      .eq(

        "roadmap_id",

        milestone.roadmap_id

      )

      .select(`

        id,

        roadmap_id,

        step_order,

        title,

        description,

        is_completed

      `)

      .single();



    if (error) {

      console.error(

        "Milestone詳細更新エラー:",

        error

      );



      setMessage(

        `Milestone更新エラー: ${error.message}`

      );



      setIsUpdating(false);

      return;

    }



    setMilestone(

      data as MilestoneData

    );



    setMessage(

      nextCompletedState

        ? "Milestoneを完了しました。"

        : "Milestoneを未完了に戻しました。"

    );



    setIsUpdating(false);

  };



  const handleGenerateTasks = async () => {

    if (

      !milestone ||

      isGeneratingTasks ||

      hasGeneratedTasks

    ) {

      return;

    }



    setIsGeneratingTasks(true);

    setMessage("");



    const {

      data: { user },

      error: userError,

    } = await supabase.auth.getUser();



    if (userError || !user) {

      router.push("/login");

      return;

    }



    const {

      count,

      error: existingTaskError,

    } = await supabase

      .from("tasks")

      .select("id", {

        count: "exact",

        head: true,

      })

      .eq(

        "milestone_id",

        milestone.id

      );



    if (existingTaskError) {

      console.error(

        "二重生成確認エラー:",

        existingTaskError

      );



      setMessage(

        `Task確認エラー: ${existingTaskError.message}`

      );



      setIsGeneratingTasks(false);

      return;

    }



    if ((count ?? 0) > 0) {

      setGeneratedTaskCount(count ?? 0);

      setHasGeneratedTasks(true);



      setMessage(

        "このMilestoneのTaskはすでに作成されています。"

      );



      setIsGeneratingTasks(false);

      return;

    }



    const {

      data: roadmapData,

      error: roadmapError,

    } = await supabase

      .from("roadmaps")

      .select("challenge_id")

      .eq(

        "id",

        milestone.roadmap_id

      )

      .eq("user_id", user.id)

      .maybeSingle();



    if (

      roadmapError ||

      !roadmapData

    ) {

      console.error(

        "Roadmap取得エラー:",

        roadmapError

      );



      setMessage(

        roadmapError

          ? `Roadmap取得エラー: ${roadmapError.message}`

          : "紐づくRoadmapを確認できませんでした。"

      );



      setIsGeneratingTasks(false);

      return;

    }



    const resolvedRoadmap =

      roadmapData as RoadmapData;



    const {

      data: existingGoalData,

      error: goalError,

    } = await supabase

      .from("goals")

      .select("id")

      .eq(

        "challenge_id",

        resolvedRoadmap.challenge_id

      )

      .limit(1)

      .maybeSingle();



    if (goalError) {

      console.error(

        "内部Goal取得エラー:",

        goalError

      );



      setMessage(

        `Goal取得エラー: ${goalError.message}`

      );



      setIsGeneratingTasks(false);

      return;

    }



    let goalId =

      (

        existingGoalData as

          | GoalData

          | null

      )?.id ?? null;



    if (!goalId) {

      const {

        data: challengeData,

        error: challengeError,

      } = await supabase

        .from("challenges")

        .select("title")

        .eq(

          "id",

          resolvedRoadmap.challenge_id

        )

        .eq("user_id", user.id)

        .maybeSingle();



      if (

        challengeError ||

        !challengeData

      ) {

        console.error(

          "Goal用Challenge取得エラー:",

          challengeError

        );



        setMessage(

          challengeError

            ? `Goal情報取得エラー: ${challengeError.message}`

            : "紐づくGoalを確認できませんでした。"

        );



        setIsGeneratingTasks(false);

        return;

      }



      const {

        data: createdGoal,

        error: createGoalError,

      } = await supabase

        .from("goals")

        .insert({

          challenge_id:

            resolvedRoadmap.challenge_id,

          title:

            challengeData.title,

          target_value: 100,

          current_value: 0,

        })

        .select("id")

        .single();



      if (

        createGoalError ||

        !createdGoal

      ) {

        console.error(

          "内部Goal作成エラー:",

          createGoalError

        );



        setMessage(

          createGoalError

            ? `内部Goal作成エラー: ${createGoalError.message}`

            : "Taskの追加先を作成できませんでした。"

        );



        setIsGeneratingTasks(false);

        return;

      }



      goalId = createdGoal.id;

    }



    const taskDrafts =

      createTaskDrafts(milestone);



    const taskRows = taskDrafts.map(

      (taskDraft) => ({

        goal_id: goalId,

        milestone_id: milestone.id,

        title: taskDraft.title,

        description:

          taskDraft.description,

        due_date: createDueDate(

          taskDraft.dueDateOffset

        ),

        is_completed: false,

      })

    );



    const {

      error: taskInsertError,

    } = await supabase

      .from("tasks")

      .insert(taskRows);



    if (taskInsertError) {

      console.error(

        "Milestone Task生成エラー:",

        taskInsertError

      );



      setMessage(

        `Task生成エラー: ${taskInsertError.message}`

      );



      setIsGeneratingTasks(false);

      return;

    }



    setHasGeneratedTasks(true);

    setGeneratedTaskCount(

      taskRows.length

    );



    setMessage(

      `${taskRows.length}件のTaskを作成しました。`

    );



    setIsGeneratingTasks(false);

  };



  if (isLoading) {

    return (

      <main className="milestone-detail-page">

        <div className="milestone-detail-content">

          <p className="milestone-detail-loading">

            読み込み中...

          </p>

        </div>



        <BottomNav />

      </main>

    );

  }



  if (!milestone) {

    return (

      <main className="milestone-detail-page">

        <div className="milestone-detail-content">

          <p className="roadmap-section-label">

            MILESTONE

          </p>



          <h1 className="milestone-detail-page-title">

            Milestoneを確認できません

          </h1>



          <p className="milestone-detail-error">

            {message}

          </p>



          <button

            type="button"

            className="btn-primary milestone-detail-full-button"

            onClick={() =>

              router.push("/roadmap")

            }

          >

            ロードマップへ戻る

          </button>

        </div>



        <BottomNav />

      </main>

    );

  }



  return (

    <main className="milestone-detail-page">

      <div className="milestone-detail-content">

        <button

          type="button"

          className="milestone-detail-back-button"

          onClick={() =>

            router.push("/roadmap")

          }

        >

          ← ロードマップへ戻る

        </button>



        <p className="roadmap-section-label">

          MILESTONE

        </p>



        <p className="milestone-detail-step">

          STEP {milestone.step_order}

        </p>



        <h1 className="milestone-detail-title">

          {milestone.title}

        </h1>



        <section className="milestone-detail-card">

          <div className="milestone-detail-status-row">

            <span>状態</span>



            <span

              className={`milestone-detail-status ${

                milestone.is_completed

                  ? "milestone-detail-status-completed"

                  : ""

              }`}

            >

              {milestone.is_completed

                ? "完了"

                : "未完了"}

            </span>

          </div>



          <div className="milestone-detail-description-area">

            <p className="milestone-detail-label">

              このステップで取り組むこと

            </p>



            <p className="milestone-detail-description">

              {milestone.description ??

                "説明はまだありません。"}

            </p>

          </div>

        </section>



        <section className="milestone-task-generation-card">

          <p className="milestone-detail-label">

            TASK SUPPORT

          </p>



          <h2 className="milestone-task-generation-title">

            このステップのTask

          </h2>



          <p className="milestone-task-generation-description">

            Milestoneを進めるためのTaskを

            3件作成します。

          </p>



         {hasGeneratedTasks && (

  <p className="milestone-task-generated-message">

    {generatedTaskCount}件のTaskを作成済みです。

  </p>

)}



<button

  type="button"

  className="btn-primary milestone-task-generate-button"

  disabled={

    isGeneratingTasks ||

    hasGeneratedTasks

  }

  onClick={handleGenerateTasks}

>

  {isGeneratingTasks

    ? "Task作成中..."

    : hasGeneratedTasks

      ? "Task作成済み"

      : "Taskを自動作成する"}

</button>



{hasGeneratedTasks && (

  <button

  type="button"

  className="milestone-task-view-button"

  disabled={!challengeId}

  onClick={() => {

    if (!challengeId) {

      return;

    }



    router.push(

      `/challenges/${challengeId}`

    );

  }}

>

  Goal詳細でTaskを確認する

</button>

)}

        </section>



        {message && (

          <p

            className={

              message.includes("エラー")

                ? "milestone-detail-error"

                : "milestone-detail-success"

            }

          >

            {message}

          </p>

        )}



        <button

          type="button"

          className={`btn-primary milestone-detail-toggle-button ${

            milestone.is_completed

              ? "milestone-detail-return-button"

              : ""

          }`}

          disabled={isUpdating}

          onClick={handleToggleCompleted}

        >

          {isUpdating

            ? "更新中..."

            : milestone.is_completed

              ? "未完了に戻す"

              : "このMilestoneを完了する"}

        </button>

      </div>



      <BottomNav />

    </main>

  );

}