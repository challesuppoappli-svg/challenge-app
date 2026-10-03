"use client";



import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";



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

      <h1>Profile</h1>



      <p>メールアドレス: {email}</p>



      <p>挑戦数: {challengeCount}</p>



      <p>完了タスク数: {completedCount}</p>



      <button onClick={handleLogout}>

        ログアウト

      </button>

    </main>

  );

}