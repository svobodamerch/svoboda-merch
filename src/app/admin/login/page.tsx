"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/crm/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось войти");
        setLoading(false);
        return;
      }
      router.push(searchParams.get("next") || "/admin/crm");
      router.refresh();
    } catch {
      setError("Не удалось войти");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <p className="label-lg text-ink mb-8 text-center">[СВОБОДА]* CRM</p>

      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full rounded-xl border border-line bg-bg px-4 py-3.5 text-[13px] text-ink outline-none focus:border-accent"
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <input
          className="w-full rounded-xl border border-line bg-bg px-4 py-3.5 text-[13px] text-ink outline-none focus:border-accent"
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="label rounded-xl bg-surface px-4 py-3 text-ink">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="pill label w-full justify-center bg-accent py-4 text-bg hover:bg-accent-soft disabled:bg-surface disabled:text-muted"
        >
          {loading ? "Входим…" : "Войти"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
