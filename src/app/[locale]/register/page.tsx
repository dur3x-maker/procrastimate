"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";

export default function RegisterPage() {
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
      const existing = JSON.parse(stored);
      if (existing.email === email) {
        setError(t("register.error"));
        return;
      }
    }

    localStorage.setItem(
      "procrastimate_user",
      JSON.stringify({ email, password })
    );
    localStorage.setItem("procrastimate_auth", "true");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            ProcrastiMate
          </Link>
          <h1 className="text-3xl font-black mt-8 mb-2">
            {t("register.title")}
          </h1>
          <p className="text-muted text-sm">{t("register.subtitle")}</p>
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

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
          >
            {t("register.button")}
          </button>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </form>

        <p className="text-center text-sm text-muted mt-6">
          {t("register.hasAccount")}{" "}
          <Link
            href="/login"
            className="text-purple-start font-medium hover:underline"
          >
            {t("register.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
