"use client";



import { useState } from "react";

import { supabase } from "@/lib/supabase";



export default function LoginPage() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");



  const handleLogin = async () => {

    const { error } =

      await supabase.auth.signInWithPassword({

        email,

        password,

      });



    if (error) {

      alert(error.message);

      return;

    }



    window.location.href = "/";

  };



  return (

    <main>

      <h1>ログイン</h1>



      <input

        type="email"

        placeholder="メールアドレス"

        value={email}

        onChange={(e) => setEmail(e.target.value)}

      />



      <br />



      <input

        type="password"

        placeholder="パスワード"

        value={password}

        onChange={(e) => setPassword(e.target.value)}

      />



      <br />



      <button onClick={handleLogin}>

        ログイン

      </button>

    </main>

  );

}