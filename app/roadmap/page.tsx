"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/app/components/BottomNav";
import {
  PERSONALITY_TYPE_EMOJIS,
  PERSONALITY_TYPE_LABELS,
} from "@/lib/personalityDiagnosis";
import type { PersonalityType } from "@/lib/personalityDiagnosis";

type RoadmapData = {
  id: string;
  challenge_id: string;
  current_level: number;
  primary_type: string;
  secondary_type: string | null;
  status: string;
  created_at: string;
};

type MilestoneData = {
  id: string;
  roadmap_id: string;
  step_order: number;
  title: string;
  description: string | null;
  is_completed: boolean;
};

type MilestoneTaskProgress = {
  total: number;
  completed: number;
};

const isPersonalityType = (value: string | null): value is PersonalityType => {
  return (
    value === "steady" ||
    value === "careful" ||
    value === "sprint" ||
    value === "explorer" ||
    value === "strategist" ||
    value === "supportive"
  );
};

export default function RoadmapPage() {
  const router = useRouter();

  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [milestones, setMilestones] = useState<MilestoneData[]>([]);
  const [goalTitle, setGoalTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(
    null
  );
  const [selectedMilestone, setSelectedMilestone] =
    useState<MilestoneData | null>(null);
  const [milestoneTaskProgress, setMilestoneTaskProgress] =
    useState<Record<string, MilestoneTaskProgress>>({});

  useEffect(() => {
    const loadRoadmap = async () => {
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

      const { data: roadmapData, error: roadmapError } = await supabase
        .from("roadmaps")
        .select(`
          id,
          challenge_id,
          current_level,
          primary_type,
          secondary_type,
          status,
          created_at
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roadmapError) {
        console.error("Roadmap取得エラー:", roadmapError);
        setMessage(`Roadmap取得エラー: ${roadmapError.message}`);
        setIsLoading(false);
        return;
      }

      if (!roadmapData) {
        setRoadmap(null);
        setMilestones([]);
        setGoalTitle("");
        setMilestoneTaskProgress({});
        setIsLoading(false);
        return;
      }

      const resolvedRoadmap = roadmapData as RoadmapData;
      setRoadmap(resolvedRoadmap);

      const [goalResult, milestoneResult] = await Promise.all([
        supabase
          .from("challenges")
          .select("title")
          .eq("id", resolvedRoadmap.challenge_id)
          .eq("user_id", user.id)
          .maybeSingle(),

        supabase
          .from("milestones")
          .select(`
            id,
            roadmap_id,
            step_order,
            title,
            description,
            is_completed
          `)
          .eq("roadmap_id", resolvedRoadmap.id)
          .order("step_order", { ascending: true }),
      ]);

      if (goalResult.error) {
        console.error("Roadmap用Goal取得エラー:", goalResult.error);
        setGoalTitle("Goal名を取得できませんでした");
      } else {
        setGoalTitle(goalResult.data?.title ?? "Goal名を取得できませんでした");
      }

      const milestoneData = (milestoneResult.data ?? []) as MilestoneData[];
      setMilestones(milestoneData);

      const milestoneIds = milestoneData.map((item) => item.id);

      if (milestoneIds.length === 0) {
        setMilestoneTaskProgress({});
        setIsLoading(false);
        return;
      }

      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("id, milestone_id, is_completed")
        .in("milestone_id", milestoneIds)
        .not("milestone_id", "is", null);

      if (taskError) {
        console.error("Milestone関連Task取得エラー:", taskError);
        setMilestoneTaskProgress({});
      } else {
        const progressMap = (taskData ?? []).reduce<
          Record<string, MilestoneTaskProgress>
        >((acc, task) => {
          if (!task.milestone_id) return acc;

          const current = acc[task.milestone_id] ?? {
            total: 0,
            completed: 0,
          };

          current.total += 1;

          if (task.is_completed) {
            current.completed += 1;
          }

          acc[task.milestone_id] = current;
          return acc;
        }, {});

        setMilestoneTaskProgress(progressMap);
      }

      setIsLoading(false);
    };

    loadRoadmap();
  }, [router]);

  const handleToggleMilestone = async (milestone: MilestoneData) => {
    if (updatingMilestoneId) {
      return;
    }

    setUpdatingMilestoneId(milestone.id);
    setMessage("");

    const nextCompletedState = !milestone.is_completed;

    const { error } = await supabase
      .from("milestones")
      .update({
        is_completed: nextCompletedState,
      })
      .eq("id", milestone.id)
      .eq("roadmap_id", milestone.roadmap_id);

    if (error) {
      console.error("Milestone更新エラー:", error);
      setMessage(`Milestone更新エラー: ${error.message}`);
      setUpdatingMilestoneId(null);
      return;
    }

    setMilestones((previousMilestones) =>
      previousMilestones.map((currentMilestone) =>
        currentMilestone.id === milestone.id
          ? {
              ...currentMilestone,
              is_completed: nextCompletedState,
            }
          : currentMilestone
      )
    );

    setUpdatingMilestoneId(null);
  };

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(
    (milestone) => milestone.is_completed
  ).length;
  const progress =
    totalMilestones === 0
      ? 0
      : Math.round((completedMilestones / totalMilestones) * 100);
  const streakDays = 12;
  const weeklyStatus = [
    true, true, false, true, true, null, null
  ];
  const bestStreak = 18;

  const daysToBest = bestStreak - streakDays;

  const activeMilestone =
    milestones.find((milestone) => !milestone.is_completed) ?? null;

  const activeMilestoneProgress = activeMilestone
    ? milestoneTaskProgress[activeMilestone.id] ?? {
        total: 0,
        completed: 0,
      }
    : { total: 0, completed: 0 };

  const selectedMilestoneProgress = selectedMilestone
    ? milestoneTaskProgress[selectedMilestone.id] ?? {
        total: 0,
        completed: 0,
      }
    : { total: 0, completed: 0 };

  // ============================
  // ローディング
  // ============================
  if (isLoading) {
    return (
      <main className="roadmap-page">
        <div className="roadmap-page-content">
          <p className="roadmap-loading">読み込み中...</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  // ============================
  // ロードマップが存在しない場合
  // ============================
  if (!roadmap) {
    return (
      <main className="roadmap-page roadmap-empty-page">
        <div className="roadmap-empty-content">
          <p className="roadmap-section-label">ROADMAP</p>

          <h1 className="roadmap-page-title">ロードマップ</h1>
          <section className="roadmap-streak-card">
             <p className="roadmap-card-label">
                  STREAK
             </p>

              <h2 className="roadmap-streak-title">
                  🔥 {streakDays}日連続
              </h2>

            <p className="roadmap-streak-subtitle">
                自己ベストまで
                あと {daysToBest}日
            </p>
          </section>
          <section className="roadmap-weekly-card">

           <p className="roadmap-card-label">
                WEEKLY PROGRESS
           </p>

             <div className="roadmap-week-grid">
                 {["M", "T", "W", "T", "F", "S", "S"].map(
                 (day, index) => (
             <div
                  key={index}
                  className="roadmap-week-item"
                >
                <span>{day}</span>

                <strong>
                  {weeklyStatus[index] === true
                     ? "✅"
                     : weeklyStatus[index] === false
                     ? "❌"
                     : "○"}
                </strong>
              </div>
              )
            )}
            </div>
           </section>

          {message ? (
            <p className="roadmap-error-message">{message}</p>
          ) : (
            <>
              <p className="roadmap-empty-title">まだロードマップがありません</p>

              <p className="roadmap-empty-description">
                AIと一緒に
                <br />
                目標達成までの計画を作りましょう
              </p>
            </>
          )}

          {/* 🔥 修正済み Link */}
          <Link href="/roadmap/support" className="roadmap-start-button">
            AIサポートを開始
          </Link>
        </div>

        <BottomNav />
      </main>
    );
  }

  // ============================
  // ロードマップが存在する場合
  // ============================
  const primaryType = isPersonalityType(roadmap.primary_type)
    ? roadmap.primary_type
    : null;

  const secondaryType = isPersonalityType(roadmap.secondary_type)
    ? roadmap.secondary_type
    : null;

  return (
    <main className="roadmap-page">
      <div className="roadmap-page-content">
        <p className="roadmap-section-label">ROADMAP</p>

        <h1 className="roadmap-page-title">ロードマップ</h1>
        <section className="roadmap-streak-card">
             <p className="roadmap-card-label">
                  STREAK
             </p>

              <h2 className="roadmap-streak-title">
                  🔥 {streakDays}日連続
              </h2>

            <p className="roadmap-streak-subtitle">
                自己ベストまで
                あと {daysToBest}日
            </p>
          </section>
          <section className="roadmap-weekly-card">

           <p className="roadmap-card-label">
                WEEKLY PROGRESS
           </p>

             <div className="roadmap-week-grid">
                 {["M", "T", "W", "T", "F", "S", "S"].map(
                 (day, index) => (
             <div
                  key={index}
                  className="roadmap-week-item"
                >
                <span>{day}</span>

                <strong>
                  {weeklyStatus[index] === true
                     ? "✅"
                     : weeklyStatus[index] === false
                     ? "❌"
                     : "○"}
                </strong>
              </div>
              )
            )}
            </div>
           </section>

        {message && <p className="roadmap-error-message">{message}</p>}

        {/* Goal カード */}
        <section className="roadmap-goal-card">
          <p className="roadmap-card-label">進行中のGoal</p>

          <h2 className="roadmap-goal-title">{goalTitle}</h2>

          <div className="roadmap-progress-heading">
            <span>
              {completedMilestones} / {totalMilestones} Milestone完了
            </span>
            <strong>{progress}%</strong>
          </div>

          <div
            className="roadmap-main-progress"
            aria-label={`ロードマップ進捗 ${progress}%`}
          >
            <div
              className="roadmap-main-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="roadmap-current-level">
            <span>現在地</span>
            <strong>{roadmap.current_level} / 5</strong>
          </div>
        </section>

        {/* 追加: GOAL PROGRESS */}
        <section className="roadmap-hero-card">
          <p className="roadmap-card-label">GOAL PROGRESS</p>

          <div className="roadmap-hero-metric">
            <strong>{progress}%</strong>
          </div>

          <div
            className="roadmap-hero-bar"
            aria-label={`ロードマップ進捗 ${progress}%`}
          >
            <span
              className="roadmap-hero-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="roadmap-hero-caption">
            {completedMilestones} / {totalMilestones} STEP COMPLETE
          </p>
        </section>

        {/* 追加: CURRENT MISSION */}
        <section className="roadmap-mission-card">
          <p className="roadmap-card-label">CURRENT MISSION</p>

          {activeMilestone ? (
            <>
              <p className="roadmap-mission-step">
                STEP {activeMilestone.step_order}
              </p>

              <h2 className="roadmap-mission-title">{activeMilestone.title}</h2>

              <p className="roadmap-mission-subtitle">
                次に取り組むマイルストーン
              </p>

              <p className="roadmap-mission-task-progress">
                Task進捗 {activeMilestoneProgress.completed} /{" "}
                {activeMilestoneProgress.total}
              </p>
            </>
          ) : (
            <p className="roadmap-mission-empty">
              すべてのMilestoneを達成しました
            </p>
          )}
        </section>

        {/* 既存のPersonality表示は維持 */}
        {primaryType && (
          <section className="roadmap-personality-card">
            <div className="roadmap-personality-main">
              <span className="roadmap-personality-emoji">
                {PERSONALITY_TYPE_EMOJIS[primaryType]}
              </span>

              <div>
                <p className="roadmap-card-label">あなたのタイプ</p>
                <p className="roadmap-personality-name">
                  {PERSONALITY_TYPE_LABELS[primaryType]}
                </p>
              </div>
            </div>

            {secondaryType && (
              <p className="roadmap-secondary-type">
                サブタイプ：
                {PERSONALITY_TYPE_EMOJIS[secondaryType]}{" "}
                {PERSONALITY_TYPE_LABELS[secondaryType]}
              </p>
            )}
          </section>
        )}

        {/* 削除: 既存の縦並びMilestone一覧 */}

        {/* 追加: ゲームボード風 Milestone表示 */}
        <section className="roadmap-summary-card">
         <p className="roadmap-card-label">
             ROADMAP SUMMARY
         </p>

  <div className="roadmap-summary-grid">
    <div>
      <span>総STEP</span>

      <strong>
        {totalMilestones}
      </strong>
    </div>

    <div>
      <span>完了</span>

      <strong>
        {completedMilestones}
      </strong>
    </div>

    <div>
      <span>残り</span>

      <strong>
        {totalMilestones -
          completedMilestones}
      </strong>
    </div>
  </div>
</section>
        <section className="roadmap-board-card">
          <div className="roadmap-section-heading">
            <div>
              <p className="roadmap-card-label">YOUR JOURNEY</p>
              <h2>ゴールまでの道のり</h2>
            </div>
          </div>

          {milestones.length === 0 ? (
            <p className="roadmap-no-milestones">マイルストーンがありません。</p>
          ) : (
            <div className="roadmap-board">
              {milestones.map((milestone, index) => {
                const isCompleted = milestone.is_completed;
                const isActive = activeMilestone?.id === milestone.id;
                const isPending = !isCompleted && !isActive;

                return (
                  <button
                    key={milestone.id}
                    type="button"
                    className={[
                      "roadmap-board-step",
                      index % 2 === 0 ? "is-left" : "is-right",
                      isCompleted ? "is-completed" : "",
                      isActive ? "is-active" : "",
                      isPending ? "is-pending" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setSelectedMilestone(milestone)}
                    aria-label={`STEP ${milestone.step_order} ${milestone.title} を開く`}
                  >
                    <span className="roadmap-board-node">
                      <span>{milestone.step_order}</span>
                    </span>

                    <span className="roadmap-board-content">
                      <span className="roadmap-board-step-label">
                        STEP {milestone.step_order}
                      </span>
                      <span className="roadmap-board-title">
                        {milestone.title}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <Link href="/roadmap/support" className="roadmap-start-button">
          AIとロードマップを再作成
        </Link>
      </div>

      {selectedMilestone && (
        <div
          className="roadmap-modal-backdrop"
          onClick={() => setSelectedMilestone(null)}
        >
          <div
            className="roadmap-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="milestone-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="roadmap-modal-close"
              onClick={() => setSelectedMilestone(null)}
            >
              閉じる
            </button>

            <p className="roadmap-card-label">
              STEP {selectedMilestone.step_order}
            </p>

            <h3 id="milestone-modal-title" className="roadmap-modal-title">
              {selectedMilestone.title}
            </h3>

            {selectedMilestone.description && (
              <p className="roadmap-modal-description">
                {selectedMilestone.description}
              </p>
            )}

            <div className="roadmap-modal-meta">
              <div className="roadmap-modal-stat">
                <span>達成状況</span>
                <strong>
                  {selectedMilestone.is_completed ? "達成済み" : "未達成"}
                </strong>
              </div>

              <div className="roadmap-modal-stat">
                <span>関連Task総数</span>
                <strong>{selectedMilestoneProgress.total}</strong>
              </div>

              <div className="roadmap-modal-stat">
                <span>完了Task数</span>
                <strong>{selectedMilestoneProgress.completed}</strong>
              </div>

              <div className="roadmap-modal-stat">
                <span>Task進捗</span>
                <strong>
                  {selectedMilestoneProgress.completed} /{" "}
                  {selectedMilestoneProgress.total}
                </strong>
              </div>

              <div className="roadmap-modal-stat">
                <span>Milestone完了状態</span>
                <strong>
                  {selectedMilestone.is_completed ? "完了" : "未完了"}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="roadmap-modal-detail-button"
              onClick={() =>
                router.push(`/roadmap/milestone/${selectedMilestone.id}`)
              }
            >
              Milestone詳細を開く
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
