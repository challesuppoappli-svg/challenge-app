"use client";



import { useState } from "react";

import { supabase } from "@/lib/supabase";



export default function SignupPage() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");



  const handleSignup = async () => {

    const { error } = await supabase.auth.signUp({

      email,

      password,

    });



    if (error) {

      alert(error.message);

      return;

    }



    alert("確認メールを送信しました");

  };



  return (

    <main>

      <h1>新規登録</h1>



      <input

        type="email"

        placeholder="メールアドレス"

        value={email}

        onChange={(e) => setEmail(e.target.value)}

      />



      <input

        type="password"

        placeholder="パスワード"

        value={password}

        onChange={(e) => setPassword(e.target.value)}

      />



      <button onClick={handleSignup}>

        新規登録

      </button>

    </main>

  );

}