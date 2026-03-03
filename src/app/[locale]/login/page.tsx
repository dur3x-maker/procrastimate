"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const stored = localStorage.getItem("procrastimate_user");
    if (stored) {
      const user = JSON.parse(stored);
      if (user.email === email && user.password === password) {
        localStorage.setItem("procrastimate_auth", "true");
        router.push("/dashboard");
        return;
      }
    }
    setError(t("login.error"));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            ProcrastiMate
          </Link>
          <h1 className="text-3xl font-black mt-8 mb-2">{t("login.title")}</h1>
          <p className="text-muted text-sm">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("email")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-start/50 transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("password")}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-start/50 transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
          >
            {t("login.button")}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          {t("login.noAccount")}{" "}
          <Link
            href="/register"
            className="text-purple-start font-medium hover:underline"
          >
            {t("login.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
