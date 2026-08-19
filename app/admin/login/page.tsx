"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Password salah.");
      return;
    }
    router.push(params.get("next") || "/admin");
  }

  return (
    <main className="min-h-screen bg-espresso-900 flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="bg-crema-100 rounded-2xl p-8 w-full max-w-sm"
      >
        <p className="font-mono text-xs uppercase tracking-widest text-amber-600 mb-2">
          Kedai Order
        </p>
        <h1 className="font-display text-2xl font-semibold text-espresso-900 mb-6">
          Login staf
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full rounded-lg border border-espresso-900/15 px-4 py-3 mb-3"
        />
        {error && <p className="text-stamp-500 text-sm mb-3">{error}</p>}
        <button className="w-full bg-espresso-900 text-crema-100 font-semibold py-3 rounded-full hover:bg-amber-600 transition-colors">
          Masuk
        </button>
      </form>
    </main>
  );
}
