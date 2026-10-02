"use client";



import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";



export default function Home() {

  const [email, setEmail] = useState("");



  useEffect(() => {

    const getUser = async () => {

      const {

        data: { user },

      } = await supabase.auth.getUser();



      if (!user) {
        window.location.href = "/login";
        return;
      }

        setEmail(user.email ?? "");

      

    };



    getUser();

  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();

    window.location.href = "/login";
  };


  return (

    <main>

      <h1>Challenge App</h1>



      <p>ログイン中</p>



      <p>{email}</p>

      <button onClick={handleLogout}>
        ログアウト
      </button>

    </main>

  );

}
