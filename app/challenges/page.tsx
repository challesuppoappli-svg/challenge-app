"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/app/components/BottomNav"


type Challenge = {
  id: string;
  title: string;
  category: string;
  status: string;
};

export default function ChallengesPage() {
  const router = useRouter();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [message, setMessage] = useState("読み込み中...");

  useEffect(() => {
    const loadChallenges = async () => {
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
        .select("id, title, category, status")
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setMessage(`取得エラー: ${error.message}`);
        return;
      }

      setChallenges(data ?? []);
      setMessage("");
    };

    loadChallenges();
  }, [router]);

  return (
    <main>
        <p className="section-title">
            MY CHALLENGES
        </p>

      <h1 className="page-title">
        挑戦一覧
      </h1>

      <button
        type="button"
        onClick={() => router.push("/challenges/new")}
      >
        挑戦を作る
      </button>

      {message && <p>{message}</p>}
      {!message && challenges.length === 0 && (
        <div>
          <p>まだ挑戦がありません。</p>

          <button
            type="button"
            onClick={() => router.push("/challenges/new")}
          >
            最初の挑戦を始める
          </button>
        </div>
      )}
  
     
       <div>
  {challenges.map((challenge) => (
    <div
      key={challenge.id}
      className="challenge-list-card"
      onClick={() =>
        router.push(`/challenges/${challenge.id}`)
      }
    >
      <div className="challenge-list-header">
        <h2>{challenge.title}</h2>

        <span className="badge">
          {challenge.category}
        </span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: "50%",
          }}
        />
      </div>

      <div className="progress-meta">
        <span>進行中</span>
        <span>{challenge.status}</span>
      </div>
    </div>
  ))}
</div>
  
  <button className="challenge-create"
  onClick={() =>
    router.push("/challenges/new")
  }>
    + 新しい挑戦を作成
  </button>
    <BottomNav />
    </main>
  );
}