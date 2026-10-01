"use client";



import { FormEvent, useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";



export default function NewChallengePage() {

  const router = useRouter();



  const [title, setTitle] = useState("");

  const [category, setCategory] = useState("business");

  const [startDate, setStartDate] = useState("");

  const [targetDate, setTargetDate] = useState("");

  const [description, setDescription] = useState("");

  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    setMessage("");



    if (!title || !category || !startDate || !targetDate) {

      setMessage("必須項目を入力してください。");

      return;

    }



    if (targetDate <= startDate) {

      setMessage("終了日は開始日より後の日付にしてください。");

      return;

    }



    setIsSubmitting(true);



    const {

      data: { user },

      error: userError,

    } = await supabase.auth.getUser();



    if (userError || !user) {

      setIsSubmitting(false);

      router.push("/login");

      return;

    }



    const { data, error } = await supabase

      .from("challenges")

      .insert({

        user_id: user.id,

        title,

        category,

        start_date: startDate,

        target_date: targetDate,

        description: description || null,

        status: "active",

      })

      .select("id")

      .single();



    if (error) {

      console.error(error);

      setMessage(`作成エラー: ${error.message}`);

      setIsSubmitting(false);

      return;

    }



    router.push(`/challenges/${data.id}`);

  };



  return (

    <main>

      <h1>挑戦作成</h1>



      <form onSubmit={handleSubmit}>

        <div>

          <label htmlFor="title">タイトル</label>

          <input

            id="title"

            type="text"

            value={title}

            onChange={(event) => setTitle(event.target.value)}

            required

          />

        </div>



        <div>

          <label htmlFor="category">カテゴリー</label>

          <select

            id="category"

            value={category}

            onChange={(event) => setCategory(event.target.value)}

            required

          >

            <option value="business">business</option>

            <option value="sports">sports</option>

            <option value="exam">exam</option>

            <option value="qualification">qualification</option>

            <option value="habit">habit</option>

            <option value="other">other</option>

          </select>

        </div>



        <div>

          <label htmlFor="startDate">開始日</label>

          <input

            id="startDate"

            type="date"

            value={startDate}

            onChange={(event) => setStartDate(event.target.value)}

            required

          />

        </div>



        <div>

          <label htmlFor="targetDate">終了日</label>

          <input

            id="targetDate"

            type="date"

            value={targetDate}

            onChange={(event) => setTargetDate(event.target.value)}

            required

          />

        </div>



        <div>

          <label htmlFor="description">説明</label>

          <textarea

            id="description"

            value={description}

            onChange={(event) => setDescription(event.target.value)}

          />

        </div>



        <button type="submit" disabled={isSubmitting}>

          {isSubmitting ? "作成中..." : "挑戦を始める"}

        </button>



        {message && <p>{message}</p>}

      </form>

    </main>

  );

}