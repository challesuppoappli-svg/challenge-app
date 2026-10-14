"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/");
  };

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          ⚡
        </div>

        <h1 className="auth-title">
          Challify
        </h1>

        <p className="auth-subtitle">
          挑戦を習慣に変えるアプリ
        </p>

        <div className="auth-form">
          <label>
            メールアドレス
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
          />

          <label>
            パスワード
          </label>

          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
          />

          <button
            type="button"
            className="btn-primary"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading
              ? "ログイン中..."
              : "ログイン"}
          </button>
        </div>

        <p className="auth-footer">
          アカウントをお持ちでない方は
        </p>

        <button
          type="button"
          className="auth-link-button"
          onClick={() =>
            router.push("/signup")
          }
        >
          新規登録
        </button>
      </div>
    </main>
  );
}