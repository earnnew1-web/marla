"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Login failed");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-shell grid min-h-screen place-items-center px-4 py-10">
      <form onSubmit={submit} className="admin-panel w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ink text-paper">
            <Camera size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Marla Film Lab Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to manage orders</p>
          </div>
        </div>
        <label className="block">
          <span className="label">Password</span>
          <input
            className="field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="mt-3 text-sm font-semibold text-rose">{error}</p> : null}
        <button className="primary-button mt-6 w-full" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
