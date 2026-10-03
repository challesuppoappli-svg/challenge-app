"use client";



import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";



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

      <h1>挑戦一覧</h1>



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


      {challenges.length === 0 && (

  <div>

    <p>まだ挑戦がありません。</p>



    <button

      type="button"

      onClick={() =>

        router.push("/challenges/new")

      }

    >

      最初の挑戦を始める

    </button>

  </div>

)}



      <ul>

        {challenges.map((challenge) => (

          <li key={challenge.id}>

            <button

              type="button"

              onClick={() =>

                router.push(`/challenges/${challenge.id}`)

              }

            >

              {challenge.title}

            </button>



            <p>カテゴリー：{challenge.category}</p>

            <p>状態：{challenge.status}</p>

          </li>

        ))}

      </ul>

    </main>

  );

}