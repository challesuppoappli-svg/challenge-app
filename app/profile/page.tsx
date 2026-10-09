"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/app/components/BottomNav"
import { categoryLabels } from "@/lib/categoryLabels";


export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [challengeCount, setChallengeCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);


  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? "");

      const { data: challenges } = await supabase
        .from("challenges")
        .select("id");
      setChallengeCount(challenges?.length ?? 0);

      const { data: completions } = await supabase
        .from("task_completions")
        .select("id");
      setCompletedCount(completions?.length ?? 0);
    };

    loadProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

 return (
  <main>
    <p className="section-title">
      PROFILE
    </p>

    <h1 className="page-title">
      プロフィール
    </h1>

    <div className="card">
      <p className="section-title">
        EMAIL
      </p>

      <p>{email}</p>
    </div>

    <div className="stat-card">
      <div className="stat-label">
        挑戦数
      </div>

      <div className="stat-value">
        {challengeCount}
      </div>
    </div>

    <div className="stat-card">
      <div className="stat-label">
        完了タスク数
      </div>

      <div className="stat-value">
        {completedCount}
      </div>
    </div>

    <button
      className="btn-danger"
      onClick={handleLogout}
    >
      ログアウト
    </button>
    <BottomNav />
  </main>
);
}