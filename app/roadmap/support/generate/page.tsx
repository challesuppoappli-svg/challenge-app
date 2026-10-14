"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  PERSONALITY_TYPE_LABELS,
} from "@/lib/personalityDiagnosis";
import type {
  PersonalityType,
} from "@/lib/personalityDiagnosis";

type MilestoneDraft = {
  stepOrder: number;
  title: string;
  description: string;
};

const MILESTONES: MilestoneDraft[] = [
  {
    stepOrder: 1,
    title: "情報収集",
    description:
      "Goal達成に必要な情報と、現在の課題を整理します。",
  },
  {
    stepOrder: 2,
    title: "基礎構築",
    description:
      "Goal達成に必要な基礎知識と習慣を整えます。",
  },
  {
    stepOrder: 3,
    title: "実践開始",
    description:
      "小さな行動から実践を始め、経験を積みます。",
  },
  {
    stepOrder: 4,
    title: "改善",
    description:
      "実践結果を振り返り、方法や計画を改善します。",
  },
  {
    stepOrder: 5,
    title: "Goal達成",
    description:
      "最終確認を行い、Goal達成を目指します。",
  },
];

const isPersonalityType = (
  value: string | null
): value is PersonalityType => {
  return (
    value === "steady" ||
    value === "careful" ||
    value === "sprint" ||
    value === "explorer" ||
    value === "strategist" ||
    value === "supportive"
  );
};

function GenerateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goalId = searchParams.get("goalId");
  const currentLevel =
    searchParams.get("currentLevel");
  const primaryType =
    searchParams.get("primaryType");
  const secondaryType =
    searchParams.get("secondaryType");

  const currentLevelNumber =
    Number(currentLevel);

  const [loading, setLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");

  const hasValidData =
    Boolean(goalId) &&
    Number.isInteger(currentLevelNumber) &&
    currentLevelNumber >= 1 &&
    currentLevelNumber <= 5 &&
    isPersonalityType(primaryType);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleCreateRoadmap = async () => {
    if (
      !goalId ||
      !hasValidData ||
      !isPersonalityType(primaryType) ||
      isSaving
    ) {
      return;
    }

    setIsSaving(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        "ユーザー取得エラー:",
        userError
      );

      router.push("/login");
      return;
    }

    const {
      data: roadmap,
      error: roadmapError,
    } = await supabase
      .from("roadmaps")
      .insert({
        user_id: user.id,
        challenge_id: goalId,
        current_level: currentLevelNumber,
        primary_type: primaryType,
        secondary_type:
          isPersonalityType(secondaryType)
            ? secondaryType
            : null,
        status: "active",
      })
      .select("id")
      .single();

    if (roadmapError || !roadmap) {
      console.error(
        "Roadmap保存エラー:",
        roadmapError
      );

      setMessage(
        roadmapError
          ? `Roadmap保存エラー: ${roadmapError.message}`
          : "Roadmapを保存できませんでした。"
      );

      setIsSaving(false);
      return;
    }

    const milestoneRows = MILESTONES.map(
      (milestone) => ({
        roadmap_id: roadmap.id,
        step_order: milestone.stepOrder,
        title: milestone.title,
        description: milestone.description,
        is_completed: false,
      })
    );

    const { error: milestonesError } =
      await supabase
        .from("milestones")
        .insert(milestoneRows);

    if (milestonesError) {
      console.error(
        "Milestone保存エラー:",
        milestonesError
      );

      const { error: rollbackError } =
        await supabase
          .from("roadmaps")
          .delete()
          .eq("id", roadmap.id)
          .eq("user_id", user.id);

      if (rollbackError) {
        console.error(
          "Roadmap削除エラー:",
          rollbackError
        );
      }

      setMessage(
        `Milestone保存エラー: ${milestonesError.message}`
      );

      setIsSaving(false);
      return;
    }

    sessionStorage.removeItem(
      "challifyRoadmapDraft"
    );

    router.push("/roadmap");
    router.refresh();
  };

  if (!hasValidData) {
    return (
      <main className="generate-page">
        <div className="generate-content">
          <p className="roadmap-support-label">
            ROADMAP AI
          </p>

          <h1 className="roadmap-support-title">
            生成情報を確認できません
          </h1>

          <p className="generate-error">
            Goal、現在地、または診断結果がありません。
            Goal選択からもう一度進めてください。
          </p>

          <button
            type="button"
            className="btn-primary generate-button"
            onClick={() =>
              router.push(
                "/roadmap/support/goals"
              )
            }
          >
            Goal選択へ戻る
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="generate-page">
      <div className="generate-content">
        <p className="roadmap-support-label">
          ROADMAP AI
        </p>

        <h1 className="roadmap-support-title">
          ロードマップ生成
        </h1>

        {loading ? (
          <>
            <p className="generate-message">
              AIがあなた専用の
              ロードマップを作成しています...
            </p>

            <div className="generate-loader" />
          </>
        ) : (
          <>
            <div className="generate-summary">
              <div className="generate-summary-row">
                <span>現在地</span>

                <strong>
                  {currentLevelNumber} / 5
                </strong>
              </div>

              <div className="generate-summary-row">
                <span>タイプ</span>

                <strong>
                  {
                    PERSONALITY_TYPE_LABELS[
                      primaryType
                    ]
                  }
                </strong>
              </div>
            </div>

            <div className="generate-preview">
              {MILESTONES.map(
                (milestone) => (
                  <div
                    key={milestone.stepOrder}
                    className="generate-step"
                  >
                    <p className="generate-step-number">
                      STEP {milestone.stepOrder}
                    </p>

                    <h2 className="generate-step-title">
                      {milestone.title}
                    </h2>

                    <p className="generate-step-description">
                      {milestone.description}
                    </p>
                  </div>
                )
              )}
            </div>

            {message && (
              <p className="generate-error">
                {message}
              </p>
            )}

            <button
              type="button"
              className="btn-primary generate-button"
              disabled={isSaving}
              onClick={handleCreateRoadmap}
            >
              {isSaving
                ? "保存中..."
                : "このロードマップを作成"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <main className="generate-page">
          <div className="generate-content">
            <p className="generate-message">
              読み込み中...
            </p>
          </div>
        </main>
      }
    >
      <GenerateContent />
    </Suspense>
  );
}