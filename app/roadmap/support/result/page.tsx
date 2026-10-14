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
  PERSONALITY_TYPE_EMOJIS,
  PERSONALITY_TYPE_LABELS,
} from "@/lib/personalityDiagnosis";
import type {
  DiagnosisResult,
  PersonalityType,
} from "@/lib/personalityDiagnosis";

type RoadmapDraft = {
  goalId: string | null;
  currentLevel: string | null;
  diagnosis: DiagnosisResult;
};

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

function RoadmapResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [goalTitle, setGoalTitle] =
    useState("読み込み中...");
  const [goalId, setGoalId] =
    useState<string | null>(null);
  const [currentLevel, setCurrentLevel] =
    useState<string | null>(null);
  const [diagnosis, setDiagnosis] =
    useState<DiagnosisResult | null>(null);
  const [message, setMessage] = useState(
    "診断結果を読み込んでいます..."
  );
  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    const loadResult = async () => {
      const savedDraft =
        sessionStorage.getItem(
          "challifyRoadmapDraft"
        );

      let parsedDraft: RoadmapDraft | null = null;

      if (savedDraft) {
        try {
          parsedDraft = JSON.parse(
            savedDraft
          ) as RoadmapDraft;
        } catch (error) {
          console.error(
            "ロードマップ一時保存データ解析エラー:",
            error
          );
        }
      }

      const queryGoalId =
        searchParams.get("goalId");

      const queryCurrentLevel =
        searchParams.get("currentLevel");

      const queryPrimaryType =
        searchParams.get("primaryType");

      const querySecondaryType =
        searchParams.get("secondaryType");

      const resolvedGoalId =
        parsedDraft?.goalId ?? queryGoalId;

      const resolvedCurrentLevel =
        parsedDraft?.currentLevel ??
        queryCurrentLevel;

      let resolvedDiagnosis =
        parsedDraft?.diagnosis ?? null;

      if (
        !resolvedDiagnosis &&
        isPersonalityType(queryPrimaryType)
      ) {
        resolvedDiagnosis = {
          primaryType: queryPrimaryType,
          secondaryType: isPersonalityType(
            querySecondaryType
          )
            ? querySecondaryType
            : null,
          scores: {
            steady: 0,
            careful: 0,
            sprint: 0,
            explorer: 0,
            strategist: 0,
            supportive: 0,
          },
          primaryHits: {
            steady: 0,
            careful: 0,
            sprint: 0,
            explorer: 0,
            strategist: 0,
            supportive: 0,
          },
          diagnosisVersion: "1.0.0",
        };
      }

      if (
        !resolvedGoalId ||
        !resolvedCurrentLevel ||
        !resolvedDiagnosis
      ) {
        setMessage(
          "診断結果を確認できませんでした。Goal選択からもう一度進めてください。"
        );
        setIsLoading(false);
        return;
      }

      setGoalId(resolvedGoalId);
      setCurrentLevel(
        resolvedCurrentLevel
      );
      setDiagnosis(resolvedDiagnosis);

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
        .select("title")
        .eq("id", resolvedGoalId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error(
          "診断結果用Goal取得エラー:",
          error
        );

        setGoalTitle(
          "Goal名を取得できませんでした"
        );
      } else {
        setGoalTitle(data.title);
      }

      setMessage("");
      setIsLoading(false);
    };

    loadResult();
  }, [router, searchParams]);

  const handleGenerate = () => {
    if (
      !goalId ||
      !currentLevel ||
      !diagnosis
    ) {
      return;
    }

    const generateSearchParams =
      new URLSearchParams();

    generateSearchParams.set(
      "goalId",
      goalId
    );

    generateSearchParams.set(
      "currentLevel",
      currentLevel
    );

    generateSearchParams.set(
      "primaryType",
      diagnosis.primaryType
    );

    if (diagnosis.secondaryType) {
      generateSearchParams.set(
        "secondaryType",
        diagnosis.secondaryType
      );
    }

    router.push(
      `/roadmap/support/generate?${generateSearchParams.toString()}`
    );
  };

  const handleRestart = () => {
    sessionStorage.removeItem(
      "challifyRoadmapDraft"
    );

    router.push(
      "/roadmap/support/goals"
    );
  };

  if (isLoading) {
    return (
      <main className="roadmap-result-page">
        <div className="roadmap-result-content">
          <p className="roadmap-result-loading">
            {message}
          </p>
        </div>
      </main>
    );
  }

  if (
    !goalId ||
    !currentLevel ||
    !diagnosis
  ) {
    return (
      <main className="roadmap-result-page">
        <div className="roadmap-result-content">
          <p className="roadmap-support-label">
            ROADMAP AI
          </p>

          <h1 className="roadmap-support-title">
            診断結果を確認できません
          </h1>

          <p className="roadmap-result-error">
            {message}
          </p>

          <button
            type="button"
            className="btn-primary roadmap-result-full-button"
            onClick={handleRestart}
          >
            Goal選択からやり直す
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="roadmap-result-page">
      <div className="roadmap-result-content">
        <p className="roadmap-support-label">
          ROADMAP AI
        </p>

        <h1 className="roadmap-support-title">
          診断完了
        </h1>

        <p className="roadmap-result-description">
          診断結果をもとに、あなたに合った
          ロードマップを作成します。
        </p>

        <section className="roadmap-result-primary-card">
          <p className="roadmap-result-card-label">
            あなたのタイプ
          </p>

          <div className="roadmap-result-type-emoji">
            {
              PERSONALITY_TYPE_EMOJIS[
                diagnosis.primaryType
              ]
            }
          </div>

          <h2 className="roadmap-result-type-title">
            {
              PERSONALITY_TYPE_LABELS[
                diagnosis.primaryType
              ]
            }
          </h2>
        </section>

        {diagnosis.secondaryType && (
          <section className="roadmap-result-sub-card">
            <p className="roadmap-result-card-label">
              サブタイプ
            </p>

            <div className="roadmap-result-sub-type">
              <span className="roadmap-result-sub-emoji">
                {
                  PERSONALITY_TYPE_EMOJIS[
                    diagnosis.secondaryType
                  ]
                }
              </span>

              <span>
                {
                  PERSONALITY_TYPE_LABELS[
                    diagnosis.secondaryType
                  ]
                }
              </span>
            </div>
          </section>
        )}

        <section className="roadmap-result-information">
          <div className="roadmap-result-information-row">
            <span className="roadmap-result-information-label">
              Goal
            </span>

            <span className="roadmap-result-information-value">
              {goalTitle}
            </span>
          </div>

          <div className="roadmap-result-information-row">
            <span className="roadmap-result-information-label">
              現在地
            </span>

            <span className="roadmap-result-information-value">
              {currentLevel} / 5
            </span>
          </div>
        </section>

        <button
          type="button"
          className="btn-primary roadmap-result-generate-button"
          onClick={handleGenerate}
        >
          ロードマップを生成する
        </button>

        <button
          type="button"
          className="roadmap-result-restart-button"
          onClick={handleRestart}
        >
          診断をやり直す
        </button>

        <p className="roadmap-result-notice">
          診断結果は性格や能力を断定するものではなく、
          挑戦を続けやすくするために使用します。
        </p>
      </div>
    </main>
  );
}

export default function RoadmapResultPage() {
  return (
    <Suspense
      fallback={
        <main className="roadmap-result-page">
          <div className="roadmap-result-content">
            <p className="roadmap-result-loading">
              読み込み中...
            </p>
          </div>
        </main>
      }
    >
      <RoadmapResultContent />
    </Suspense>
  );
}