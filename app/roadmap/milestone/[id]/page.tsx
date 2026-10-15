"use client";



import {

  useCallback,

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

type MilestoneTask = {

  id: string;

  milestone_id: string | null;

  title: string;

  description: string | null;

  due_date: string;

  is_completed: boolean;

};


type RoadmapData = {

  challenge_id: string;

};



type GoalData = {

  id: string;

};



type GeneratedTask = {

  title: string;

  description: string;

  due_date: string;

};

const isValidIsoDate = (value: string) => {

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {

    return false;

  }


  const date = new Date(`${value}T00:00:00.000Z`);

  return (

    !Number.isNaN(date.getTime()) &&

    date.toISOString().slice(0, 10) === value

  );

};


const isGeneratedTaskResponse = (

  value: unknown

): value is { tasks: GeneratedTask[] } => {

  if (

    typeof value !== "object" ||

    value === null ||

    !("tasks" in value) ||

    !Array.isArray(value.tasks) ||

    value.tasks.length < 1 ||

    value.tasks.length > 20

  ) {

    return false;

  }


  return value.tasks.every(

    (task: unknown) =>

      typeof task === "object" &&

      task !== null &&

      "title" in task &&

      typeof task.title === "string" &&

      task.title.trim().length > 0 &&

      "description" in task &&

      typeof task.description === "string" &&

      task.description.trim().length > 0 &&

      "due_date" in task &&

      typeof task.due_date === "string" &&

      isValidIsoDate(task.due_date)

  );

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

  const [milestoneTasks, setMilestoneTasks] =

    useState<MilestoneTask[]>([]);

  const [isLoadingTasks, setIsLoadingTasks] =

    useState(true);

  const [hasTaskLoadError, setHasTaskLoadError] =

    useState(false);


  const fetchMilestoneTasks = useCallback(

    async (

      taskMilestoneId: string | null

    ): Promise<boolean> => {

      if (!taskMilestoneId) {

        setMilestoneTasks([]);

        setIsLoadingTasks(false);

        setHasTaskLoadError(false);

        return false;

      }


      setIsLoadingTasks(true);

      setHasTaskLoadError(false);


      try {

        const {

          data,

          error,

        } = await supabase

          .from("tasks")

          .select(`

            id,

            milestone_id,

            title,

            description,

            due_date,

            is_completed

          `)

          .eq(

            "milestone_id",

            taskMilestoneId

          )

          .order("due_date", {

            ascending: true,

          });


        if (error) {

          console.error(

            "Milestone Task取得エラー:",

            error

          );

          setMessage(

            `Task取得エラー: ${error.message}`

          );

          setHasTaskLoadError(true);

          return false;

        }


        const tasks =

          (data ?? []) as MilestoneTask[];


        setMilestoneTasks(tasks);

        setHasTaskLoadError(false);

        return true;

      } catch (error) {

        console.error(

          "Milestone Task取得エラー:",

          error

        );

        setMessage(

          `Task取得エラー: ${

            error instanceof Error

              ? error.message

              : "Taskを取得できませんでした。"

          }`

        );

        setHasTaskLoadError(true);

        return false;

      } finally {

        setIsLoadingTasks(false);

      }

    },

    []

  );


  const totalTaskCount =

    milestoneTasks.length;


  const completedTaskCount =

    milestoneTasks.filter(

      (task) => task.is_completed

    ).length;


  const taskProgress =

    totalTaskCount === 0

      ? 0

      : Math.round(

          (completedTaskCount /

            totalTaskCount) *

            100

        );


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

      await fetchMilestoneTasks(

        resolvedMilestone.id

      );

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

  }, [

    fetchMilestoneTasks,

    milestoneId,

    router,

  ]);



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
    setIsGeneratingTasks(true);
    setMessage("");
    setMessage("");
    let generationStage: "ai" | "save" = "ai";

    try {

    const {

      data: { user },

      error: userError,

    } = await supabase.auth.getUser();



    if (userError || !user) {

      router.push("/login");

      return;

    }

    const {

      data: { session },

      error: sessionError,

    } = await supabase.auth.getSession();


    if (sessionError || !session?.access_token) {

      if (sessionError) {

        console.error(

          "認証セッション取得エラー:",

          sessionError

        );

      }

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

    let aiResponse: Response;

    try {

      aiResponse = await fetch(

        "/api/roadmap/generate-tasks",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${session.access_token}`,

          },

          body: JSON.stringify({

            milestoneId: milestone.id,

          }),

        }

      );

    } catch (error) {

      console.error(

        "AI Task生成API通信エラー:",

        error

      );

      setMessage("AI Task生成に失敗しました。");

      return;

    }


    let aiResult: unknown;

    try {

      aiResult = await aiResponse.json();

    } catch (error) {

      console.error(

        "AI Task生成APIレスポンス解析エラー:",

        error

      );

      setMessage("生成結果の形式が正しくありません。");

      return;

    }


    if (aiResponse.status === 401) {

      router.push("/login");

      return;

    }


    if (!aiResponse.ok) {

      const apiError =

        typeof aiResult === "object" &&

        aiResult !== null &&

        "error" in aiResult &&

        typeof aiResult.error === "string"

          ? aiResult.error

          : "";


      console.error(

        "AI Task生成APIエラー:",

        aiResponse.status,

        apiError

      );

      setMessage(

        aiResponse.status === 503

          ? "AIの設定を確認してください。"

          : aiResponse.status >= 500

            ? "AI Task生成に失敗しました。"

            : apiError || "Taskを作成できませんでした。"

      );

      return;

    }


    if (!isGeneratedTaskResponse(aiResult)) {

      console.error(

        "AI Task生成APIのレスポンス形式が不正です。"

      );

      setMessage("生成結果の形式が正しくありません。");

      return;

    }


    const generatedTasks = aiResult.tasks;

    generationStage = "save";


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



    const taskRows = generatedTasks.map(

      (task) => ({

        goal_id: goalId,

        milestone_id: milestone.id,

        title: task.title,

        description: task.description,

        due_date: task.due_date,

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

        "Taskの保存に失敗しました。"

      );



      setIsGeneratingTasks(false);

      return;

    }



    setGeneratedTaskCount(taskRows.length);

    setHasGeneratedTasks(true);

    const tasksLoaded =

      await fetchMilestoneTasks(

        milestone.id

      );


    if (tasksLoaded) {

      setMessage(

        `${taskRows.length}件のTaskを作成しました。`

      );

    }



    } catch (error) {

      console.error(

        "Milestone Task生成処理エラー:",

        error

      );

      setMessage(
        generationStage === "save"
          ? "Taskの保存に失敗しました。"
          : "AI Task生成に失敗しました。"
      );

    } finally {

      setIsGeneratingTasks(false);

    }

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



        <section className="milestone-task-progress-card">
          <div className="milestone-task-progress-header">
            <p className="milestone-detail-label">
              TASK PROGRESS
            </p>
            <span className="milestone-task-progress-count">
              {completedTaskCount} / {totalTaskCount}
            </span>
          </div>

          <div
            className="milestone-task-progress-bar"
            role="progressbar"
            aria-label="Task進捗"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={taskProgress}
          >
            <div
              className="milestone-task-progress-fill"
              style={{
                width: `${taskProgress}%`,
              }}
            />
          </div>

          <p className="milestone-task-progress-percent">
            {taskProgress}%
          </p>
        </section>

        <section className="milestone-task-list-card">
          <h2 className="milestone-detail-label">
            TASKS
          </h2>

          {isLoadingTasks ? (
            <p className="milestone-task-loading">
              読み込み中...
            </p>
          ) : hasTaskLoadError ? (
            <p className="milestone-task-loading">
              Taskを読み込めませんでした。
            </p>
          ) : totalTaskCount === 0 ? (
            <p className="milestone-task-empty">
              このMilestoneにはまだTaskがありません。
            </p>
          ) : (
            <ul className="milestone-task-list">
              {milestoneTasks.map((task) => (
                <li
                  key={task.id}
                  className={`milestone-task-item ${
                    task.is_completed
                      ? "milestone-task-item-completed"
                      : ""
                  }`}
                >
                  <span
                    className="milestone-task-check"
                    aria-label={
                      task.is_completed
                        ? "完了"
                        : "未完了"
                    }
                  >
                    {task.is_completed ? "✓" : ""}
                  </span>

                  <div className="milestone-task-content">
                    <p
                      className={`milestone-task-title ${
                        task.is_completed
                          ? "milestone-task-title-completed"
                          : ""
                      }`}
                    >
                      {task.title}
                    </p>

                    {task.description && (
                      <p className="milestone-task-description">
                        {task.description}
                      </p>
                    )}

                    <p className="milestone-task-date">
                      {task.is_completed
                        ? "完了"
                        : "未完了"}
                      {" ・ "}
                      期限: {task.due_date}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="milestone-task-generation-card">
          <p className="milestone-detail-label">
            TASK SUPPORT
          </p>

          <h2 className="milestone-task-generation-title">
            このステップのTask
          </h2>

          <p className="milestone-task-generation-description">
            AIが期間と難易度を考慮して、必要なTaskを作成します。
          </p>

          {hasGeneratedTasks && (
            <p className="milestone-task-generated-message">
              {hasTaskLoadError
                ? generatedTaskCount
                : totalTaskCount}
              件のTaskを作成済みです。
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
              ? "AIがTaskを作成中..."
              : hasGeneratedTasks
                ? "Task作成済み"
                : "AIでTaskを作成する"}
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

        {totalTaskCount > 0 &&
          completedTaskCount < totalTaskCount && (
            <p className="milestone-task-warning">
              未完了のTaskが残っています。
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