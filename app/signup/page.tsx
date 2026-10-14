"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    passwordConfirmation,
    setPasswordConfirmation,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const handleSignup = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      password !==
      passwordConfirmation
    ) {
      setMessage(
        "パスワードが一致しません"
      );
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.signUp({
        email,
        password,
      });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "確認メールを送信しました"
    );
  };

  return (
    <main className="auth-page">
      <div className="auth-container">
        <p className="section-title">
          SIGN UP
        </p>

        <h1 className="auth-title">
          アカウント作成
        </h1>

        <form
          className="auth-form"
          onSubmit={handleSignup}
        >
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
          />

          <input
            type="password"
            placeholder="パスワード確認"
            value={
              passwordConfirmation
            }
            onChange={(event) =>
              setPasswordConfirmation(
                event.target.value
              )
            }
          />

          {message && (
            <p>{message}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
          >
            {loading
              ? "作成中..."
              : "アカウントを作成"}
          </button>
        </form>

        <p className="auth-footer">
          すでにアカウントをお持ちの方は
        </p>

        <button
          type="button"
          className="auth-link-button"
          onClick={() =>
            router.push("/login")
          }
        >
          ログイン
        </button>
      </div>
    </main>
  );
}