"use client";


import { FormEvent,useEffect,useState, } from "react";
import { useParams,useRouter, } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/app/components/BottomNav";
import { categoryLabels } from "@/lib/categoryLabels";


type Challenge = {
  id: string;
  title: string;
  category: string;
  start_date: string;
  target_date: string;
  description: string | null;
  status: string;
};


type Goal = {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
};


type Task = {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  due_date: string;
  is_completed: boolean;
  goals:
    | {
        title: string;
        challenge_id: string;
      }
    | {
        title: string;
        challenge_id: string;
      }[];
};


export default function ChallengeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [ challenge, setChallenge] = useState<Challenge | null>(null);
  const [ message, setMessage] = useState("読み込み中...");
  const [ goals, setGoals] = useState<Goal[]>([]);
  const [ selectedGoalId, setSelectedGoalId, ] = useState("");
  const [ taskTitle, setTaskTitle] = useState("");
  const [ taskDescription, setTaskDescription, ] = useState("");
  const [ dueDate, setDueDate] = useState("");
  const [ taskMessage, setTaskMessage] = useState("");
  const [ tasks, setTasks] = useState<Task[]>([]);
  const [ reflection, setReflection] = useState("");
  const [ reflectionMessage, setReflectionMessage,] = useState("")
  const [ showTaskModal, setShowTaskModal,] = useState(false);
  const [ showReflectionModal, setShowReflectionModal, ] = useState(false);
  const [ openedTaskMenu, setOpenedTaskMenu, ] = useState<string | null>(null);
  const [ editingTaskId, setEditingTaskId,] = useState<string | null>(null);
  const [ editTaskTitle, setEditTaskTitle,] = useState("");
  const [ editTaskDescription, setEditTaskDescription,] = useState("");
  const [ editDueDate, setEditDueDate,] = useState("");
  const [ showCompletedTasks, setShowCompletedTasks,] = useState(false);
  const [ openedGoalMenu, setOpenedGoalMenu,] = useState(false);
  const [ showGoalEditModal, setShowGoalEditModal,] = useState(false);
  const [ editGoalTitle, setEditGoalTitle,] = useState("");
  const [ editGoalDescription, setEditGoalDescription,] = useState("");
  const fetchTasks = async () => {
  const {
      data: tasksData,
      error: tasksError,
    } = await supabase
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
      .eq(
        "goals.challenge_id",
        params.id
      )
      .order("due_date", {
        ascending: false,
      });


    if (tasksError) {
      console.error(
        "Task取得エラー:",
        tasksError
      );


      setTaskMessage(
        `Task取得エラー: ${tasksError.message}`
      );

      return;
    }


    setTasks(
      (tasksData ?? []) as Task[]
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


      const {
        data,
        error,
      } = await supabase
        .from("challenges")
        .select(
          `
            id,
            title,
            category,
            start_date,
            target_date,
            description,
            status
          `
        )
        .eq("id", params.id)
        .single();


      if (error) {
        console.error(
          "Challenge取得エラー:",
          error
        );


        setMessage(
          `取得エラー: ${error.message}`
        );


        return;
      }


      const {
        data: goalsData,
        error: goalsError,
      } = await supabase
        .from("goals")
        .select(
          `
            id,
            title,
            target_value,
            current_value
          `
        )
        .eq(
          "challenge_id",
          params.id
        );


      if (goalsError) {
        console.error(
          "Goal取得エラー:",
          goalsError
        );


        setMessage(
          `Goal取得エラー: ${goalsError.message}`
        );

        return;
      }


     let loadedGoals =

  (goalsData ?? []) as Goal[];


if (loadedGoals.length === 0) {
  const {
    data: createdGoal,
    error: createGoalError,
  } = await supabase
    .from("goals")
    .insert({
      challenge_id: params.id,
      title: data.title,
      target_value: 100,
      current_value: 0,
    })
    .select(
      `
        id,
        title,
        target_value,
        current_value
      `
    )
    .single();
  if (createGoalError) {
    console.error(
      "内部Goal作成エラー:",
      createGoalError
    );
    setMessage(
      `内部Goal作成エラー: ${createGoalError.message}`
    );
    return;
  }

  loadedGoals = [
    createdGoal as Goal,
  ];
}

setGoals(loadedGoals);
setSelectedGoalId(
  loadedGoals[0].id
);


      setChallenge(data);
      await fetchTasks();
      setMessage("");

      console.log("selectedGoalId",selectedGoalId);
      console.log("goals",goals);
      console.log("taskTitle",taskTitle);
      console.log("dueDate",dueDate);
    };


    getChallenge();
  }, [params.id, router]);


  const handleTaskSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setTaskMessage("");

    const goalId =selectedGoalId ||
    goals[0]?.id;

    if (!goalId) {
        setTaskMessage(
            "Taskの追加先となるGoalがありません。"
        );
        return;
    }

    if (
      !goalId ||
      !taskTitle.trim() ||
      !dueDate
    ) {
      setTaskMessage(
        "Taskタイトルと実施日を入力してください。"
      );
      return;
    }


    const { error } = await supabase
      .from("tasks")
      .insert({
        goal_id: goalId,
        title: taskTitle.trim(),
        description:
          taskDescription.trim() ||
          null,
        due_date: dueDate,
        is_completed: false,
      });


    if (error) {
      console.error(
        "Task作成エラー:",
        error
      );


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

    setShowTaskModal(false);

    await fetchTasks();
  };

  const handleToggleTask = async (
  taskId: string
) => {
  const selectedTask = tasks.find(
    (task) => task.id === taskId
  );


  if (!selectedTask) {
    return;
  }


  const nextCompleted =
    !selectedTask.is_completed;


  const { error: updateError } =
    await supabase
      .from("tasks")
      .update({
        is_completed: nextCompleted,
      })
      .eq("id", taskId);


  if (updateError) {
    console.error(
      "Task更新エラー:",
      updateError
    );


    setTaskMessage(
      `Task更新エラー: ${updateError.message}`
    );


    return;
  }


  if (nextCompleted) {
    const { error: completionError } =
      await supabase
        .from("task_completions")
        .insert({
          task_id: taskId,
          completed_at:
            new Date().toISOString(),
        });


    if (completionError) {
      console.error(
        "完了履歴保存エラー:",
        completionError
      );


      setTaskMessage(
        `完了履歴保存エラー: ${completionError.message}`
      );


      return;
    }
  } else {
    const { error: deleteError } =
      await supabase
        .from("task_completions")
        .delete()
        .eq("task_id", taskId);


    if (deleteError) {
      console.error(
        "完了履歴削除エラー:",
        deleteError
      );

      setTaskMessage(
        `完了履歴削除エラー: ${deleteError.message}`
      );


      return;
    }
  }


  setTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            is_completed: nextCompleted,
          }
        : task
    )
  );


  setTaskMessage(
    nextCompleted
      ? "Taskを完了しました。"
      : "Taskを未完了に戻しました。"
  );
};


const handleDeleteTask = async (
  taskId: string
) => {
  const confirmed = window.confirm(
    "このTaskを削除しますか？"
  );


  if (!confirmed) {
    return;
  }


  const { error: completionDeleteError } =
    await supabase
      .from("task_completions")
      .delete()
      .eq("task_id", taskId);


  if (completionDeleteError) {
    console.error(
      "完了履歴削除エラー:",
      completionDeleteError
    );


    setTaskMessage(
      `完了履歴削除エラー: ${completionDeleteError.message}`
    );


    return;
  }


  const { error: taskDeleteError } =
    await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);


  if (taskDeleteError) {
    console.error(
      "Task削除エラー:",
      taskDeleteError
    );


    setTaskMessage(
      `Task削除エラー: ${taskDeleteError.message}`
    );


    return;
  }


  setTasks((currentTasks) =>
    currentTasks.filter(
      (task) => task.id !== taskId
    )
  );


  setOpenedTaskMenu(null);
  setTaskMessage(
    "Taskを削除しました。"
  );
};


const handleOpenEditTask = (
  task: Task
) => {
  setEditingTaskId(task.id);
  setEditTaskTitle(task.title);
  setEditTaskDescription(
    task.description ?? ""
  );
  setEditDueDate(task.due_date);
  setOpenedTaskMenu(null);
};


const handleEditTaskSubmit = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();


  if (
    !editingTaskId ||
    !editTaskTitle.trim() ||
    !editDueDate
  ) {
    setTaskMessage(
      "Taskタイトルと実施日を入力してください。"
    );


    return;
  }


  const { error } = await supabase
    .from("tasks")
    .update({
      title: editTaskTitle.trim(),
      description:
        editTaskDescription.trim() ||
        null,
      due_date: editDueDate,
    })
    .eq("id", editingTaskId);


  if (error) {
    console.error(
      "Task編集エラー:",
      error
    );


    setTaskMessage(
      `Task編集エラー: ${error.message}`
    );


    return;
  }


  setTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === editingTaskId
        ? {
            ...task,
            title:
              editTaskTitle.trim(),
            description:
              editTaskDescription.trim() ||
              null,
            due_date: editDueDate,
          }
        : task
    )
  );


  setEditingTaskId(null);
  setEditTaskTitle("");
  setEditTaskDescription("");
  setEditDueDate("");


  setTaskMessage(
    "Taskを編集しました。"
  );
};

const handleOpenGoalEdit = () =>{
    setEditGoalTitle(
        challenge?.title ?? ""
    );
setEditGoalDescription(
    challenge?.description ?? ""
);
setShowGoalEditModal(true);
}
const handleUpdateGoal = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  if (!challenge) {
    return;
  }

  const { error } =
    await supabase
      .from("challenges")
      .update({
        title:
          editGoalTitle.trim(),
        description:
          editGoalDescription.trim() ||
          null,
      })
      .eq(
        "id",
        challenge.id
      );

  if (error) {
    alert(error.message);
    return;
  }

  setChallenge({
    ...challenge,
    title:
      editGoalTitle.trim(),
    description:
      editGoalDescription.trim() ||
      null,
  });

  setShowGoalEditModal(false);
};
const handleDeleteGoal = async () => {
    if (!challenge) {
        return;
    }
    const confirmed =window.confirm(
        "このGoalを削除しますか？"
    );
    if (!confirmed) {
        return;
    }
    const { error } = await supabase
    .from("challenges")
    .delete()
    .eq("id", challenge.id);
    if ( error ) {
        alert(error.message);
        return;
    }
    router.push("/challenges");
};


const handleReflectionSubmit = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();


  if (!reflection.trim()) {
    setReflectionMessage(
      "振り返りを入力してください。"
    );


    return;
  }


  const { error } = await supabase
    .from("reflections")
    .insert({
      challenge_id: params.id,
      content: reflection.trim(),
    });


  if (error) {
    console.error(
      "Reflection保存エラー:",
      error
    );


    setReflectionMessage(
      `保存エラー: ${error.message}`
    );


    return;
  }


  setReflection("");
  setReflectionMessage(
    "振り返りを保存しました。"
  );
  setShowReflectionModal(false);
};


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
        <p>
          Goalが見つかりません。
        </p>
      </main>
    );
  }


  const completedTaskCount =
    tasks.filter(
      (task) => task.is_completed
    ).length;


  const progress =
    tasks.length === 0
      ? 0
      : Math.round(
          (completedTaskCount /
            tasks.length) *
            100
        );


  const remainingDays =
    challenge.target_date
      ? Math.max(
          0,
          Math.ceil(
            (new Date(
              `${challenge.target_date}T00:00:00`
            ).getTime() -
              Date.now()) /
              (1000 *
                60 *
                60 *
                24)
          )
        )
      : 0;

    const incompleteTasks = tasks.filter(
        (task) => !task.is_completed
    );
    const completedTasks = tasks.filter(
        (task) => task.is_completed
    );


  return (
    <main
        onClick={() => {
            setOpenedTaskMenu(null);
            setOpenedGoalMenu(false);
        }}
        >
      <div className="detail-title-row">
        <button
          type="button"
          className="back-button"
          aria-label="Goal一覧へ戻る"
          onClick={() =>
            router.push(
              "/challenges"
            )
        }
        >
          ←
        </button>


       <div className="goal-title-wrapper">
  <div className="goal-title-header">
    <h1 className="page-title">
      {challenge.title}
    </h1>
  </div>

  <div className="detail-badges">
    <span className="badge">
      {categoryLabels[challenge.category] ??
        challenge.category}
    </span>

    <span className="badge">
      残り{remainingDays}日
    </span>

    <div
      className="task-menu-wrapper"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <button
        type="button"
        className="task-menu-button"
        aria-label="Goalメニュー"
        onClick={() =>
          setOpenedGoalMenu(
            !openedGoalMenu
          )
        }
      >
        ⋮
      </button>

      {openedGoalMenu && (
        <div className="task-menu">
          <button
            type="button"
            onClick={() => {
              setOpenedGoalMenu(false);
              handleOpenGoalEdit();
            }}
          >
            編集
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenedGoalMenu(false);
              handleDeleteGoal();
            }}
          >
            削除
          </button>
        </div>
      )}
      </div>
    </div>
  </div>
</div>


      <section className="card">
        <p className="section-title">
          目標
        </p>


        <h2>
          {challenge.description ||
            "説明なし"}
        </h2>
      </section>


      <section className="card">
        <div className="progress-header">
          <p className="section-title">
            PROGRESS
          </p>


          <h2 className="progress-percent">
            {progress}%
          </h2>
        </div>


        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>


        <div className="progress-stats">
          <div>
            <p className="stat-label">
              完了タスク
            </p>


            <p className="stat-value-small">
              {completedTaskCount}/
              {tasks.length}
            </p>
          </div>


          <div>
            <p className="stat-label">
              連続日数
            </p>


            <p className="stat-value-small">
              0日
            </p>
          </div>
        </div>
      </section>


   <section className="card">
  <p className="section-title">
    TODAY'S TASKS
  </p>

  <div className="goal-task-list">
    {tasks.length === 0 ? (
      <p className="page-subtitle">
        Taskはまだありません。
      </p>
    ) : (
      <>
        <h3>未完了タスク</h3>

        {incompleteTasks.length === 0 ? (
          <p className="page-subtitle">
            未完了タスクはありません。
          </p>
        ) : (
          incompleteTasks.map((task) => (
            <div
              key={task.id}
              className="goal-task-row"
            >
              <button
                type="button"
                className="goal-task-check"
                aria-label="完了にする"
                onClick={() =>
                  handleToggleTask(task.id)
                }
              />

              <span className="goal-task-content">
                <strong>{task.title}</strong>

                <small>{task.due_date}</small>
              </span>

              <div className="task-menu-wrapper">
                <button
                  type="button"
                  className="task-menu-button"
                  aria-label="Taskメニュー"
                  onClick={() =>
                    setOpenedTaskMenu(
                      openedTaskMenu === task.id
                        ? null
                        : task.id
                    )
                  }
                >
                  ⋮
                </button>

                {openedTaskMenu === task.id && (
                  <div className="task-menu">
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenEditTask(task)
                      }
                    >
                      編集
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenedTaskMenu(null);
                        handleDeleteTask(task.id);
                      }}
                    >
                      削除
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        <button
          type="button"
          className="completed-toggle"
          onClick={() =>
            setShowCompletedTasks(
              !showCompletedTasks
            )
          }
        >
          達成済みタスク
          {showCompletedTasks ? " ▲" : " ▼"}
        </button>

        {showCompletedTasks && (
          <div className="completed-task-list">
            {completedTasks.length === 0 ? (
              <p className="page-subtitle">
                達成済みタスクはありません。
              </p>
            ) : (
              completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="goal-task-row goal-task-row-completed"
                >
                  <button
                    type="button"
                    className="goal-task-check"
                    aria-label="未完了に戻す"
                    onClick={() =>
                      handleToggleTask(task.id)
                    }
                  >
                    ✓
                  </button>

                  <span className="goal-task-content">
                    <strong> 
                         {task.title}
                    </strong>

                    <small>{task.due_date}</small>
                  </span>

                  <div className="task-menu-wrapper"
                       onClick={(event) => 
                        event.stopPropagation()
                       }
                        >
                    <button
                      type="button"
                      className="task-menu-button"
                      aria-label="Taskメニュー"
                      onClick={() =>
                        setOpenedTaskMenu(
                          openedTaskMenu === task.id
                            ? null
                            : task.id
                        )
                      }
                    >
                      ⋮
                    </button>

                    {openedTaskMenu === task.id && (
                      <div className="task-menu">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenEditTask(task)
                          }
                        >
                          編集
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenedTaskMenu(null);
                            handleDeleteTask(task.id);
                          }}
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </>
    )}
  </div>
</section>


      <button
        type="button"
        className="fab-reflection"
        aria-label="振り返りを入力"
        onClick={() =>
          setShowReflectionModal(true)
        }
      >
        📄
      </button>


      <button
        type="button"
        className="fab-task"
        aria-label="Taskを追加"
        onClick={() =>
          setShowTaskModal(true)
        }
      >
        +
      </button>


      {showTaskModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowTaskModal(false)
          }
        >
          <div
            className="modal-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2>Task追加</h2>


            <form
              onSubmit={
                handleTaskSubmit
              }
            >
              <div>
                <label>
                  Taskタイトル
                </label>


                <input
                  type="text"
                  value={taskTitle}
                  onChange={(event) =>
                    setTaskTitle(
                      event.target.value
                    )
                  }
                />
              </div>


              <div>
                <label>説明</label>


                <textarea
                  value={
                    taskDescription
                  }
                  onChange={(event) =>
                    setTaskDescription(
                      event.target.value
                    )
                  }
                />
              </div>


              <div>
                <label>実施日</label>


                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(
                      event.target.value
                    )
                  }
                />
              </div>

             {taskMessage && (
                <p>{taskMessage}</p>
              )}

              <button
                type="submit"
                className="btn-primary">
                保存
              </button>
            </form>


            <button
              type="button"
              onClick={() =>
                setShowTaskModal(false)
              }
            >
              閉じる
            </button>
          </div>
        </div>
      )}


      {showReflectionModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowReflectionModal(
              false
            )
          }
        >
          <div
            className="modal-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2>振り返り</h2>


            <form
              onSubmit={
                handleReflectionSubmit
              }
            >
              <textarea
                value={reflection}
                onChange={(event) =>
                  setReflection(
                    event.target.value
                  )
                }
                placeholder="今日どうだった？"
              />


              {reflectionMessage && (
                <p>
                  {reflectionMessage}
                </p>
              )}


              <button
                type="submit"
                className="btn-primary"
              >
                保存
              </button>
            </form>


            <button
              type="button"
              onClick={() =>
                setShowReflectionModal(
                  false
                )
              }
            >
              閉じる
            </button>
          </div>
        </div>
      )}

{editingTaskId && (
  <div
    className="modal-overlay"
    onClick={() =>
      setEditingTaskId(null)
    }
  >
    <div
      className="modal-content"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <h2>Task編集</h2>


      <form
        onSubmit={
          handleEditTaskSubmit
        }
      >
        <div>
          <label>
            Taskタイトル
          </label>


          <input
            type="text"
            value={editTaskTitle}
            onChange={(event) =>
              setEditTaskTitle(
                event.target.value
              )
            }
          />
        </div>


        <div>
          <label>説明</label>


          <textarea
            value={
              editTaskDescription
            }
            onChange={(event) =>
              setEditTaskDescription(
                event.target.value
              )
            }
          />
        </div>


        <div>
          <label>実施日</label>


          <input
            type="date"
            value={editDueDate}
            onChange={(event) =>
              setEditDueDate(
                event.target.value
              )
            }
          />
        </div>


        <button
          type="submit"
          className="btn-primary"
        >
          変更を保存
        </button>
      </form>


      <button
        type="button"
        onClick={() =>
          setEditingTaskId(null)
        }
      >
        キャンセル
      </button>
    </div>
  </div>
)}

{showGoalEditModal && (
  <div
    className="modal-overlay"
    onClick={() =>
      setShowGoalEditModal(false)
    }
  >
    <div
      className="modal-content"
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      <h2>Goal編集</h2>

      <form
        onSubmit={handleUpdateGoal}
      >
        <div>
          <label>
            Goalタイトル
          </label>

          <input
            type="text"
            value={editGoalTitle}
            onChange={(event) =>
              setEditGoalTitle(
                event.target.value
              )
            }
          />
        </div>

        <div>
          <label>説明</label>

          <textarea
            value={editGoalDescription}
            onChange={(event) =>
              setEditGoalDescription(
                event.target.value
              )
            }
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
        >
          保存
        </button>
      </form>

      <button
        type="button"
        onClick={() =>
          setShowGoalEditModal(false)
        }
      >
        キャンセル
      </button>
    </div>
  </div>
)}

      <BottomNav />
    </main>
  );
}