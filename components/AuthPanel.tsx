"use client";

import { useState } from "react";
import {
  type AuthSession,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/auth";

type AuthPanelProps = {
  onAuthenticated: (session: AuthSession) => void;
};

export default function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitAuth() {
    if (!email.trim() || password.length < 6) {
      setMessage("Isi email dan password minimal 6 karakter.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      if (mode === "register") {
        const data = await signUpWithPassword(email.trim(), password);

        if (data.access_token) {
          const session = await signInWithPassword(email.trim(), password);
          onAuthenticated(session);
          return;
        }

        setMessage(
          "Akun dibuat. Jika Supabase meminta verifikasi, cek email lalu login."
        );
        setMode("login");
        return;
      }

      const session = await signInWithPassword(email.trim(), password);
      onAuthenticated(session);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Autentikasi gagal. Coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-8 text-slate-100">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex min-h-[520px] flex-col justify-center rounded-2xl border border-slate-800 bg-slate-900/80 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
            FrankLab Studio Voice PRO
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            Buat voice over AI bahasa Indonesia.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
            Masuk atau buat akun untuk mulai menulis script, memilih suara, dan
            menghasilkan audio siap pakai.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold">
              {mode === "login" ? "Login" : "Buat Akun"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Gunakan email dan password milik kamu sendiri.
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-950 p-1">
            <button
              onClick={() => setMode("login")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-slate-300">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-400"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold text-slate-300">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-400"
              />
            </label>

            {message && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-100">
                {message}
              </div>
            )}

            <button
              onClick={submitAuth}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Memproses..."
                : mode === "login"
                  ? "Masuk"
                  : "Buat Akun"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
