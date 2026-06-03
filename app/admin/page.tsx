"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AUTH_STORAGE_KEY,
  type AuthSession,
  isSupabaseAuthConfigured,
} from "@/lib/auth";

type AdminUser = {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

type UsersResponse = {
  success?: boolean;
  users?: AdminUser[];
  user?: AdminUser;
  error?: string;
};

export default function AdminPage() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedAuth) {
          setAuthSession(JSON.parse(savedAuth) as AuthSession);
        }
      } catch {
        setAuthSession(null);
      } finally {
        setReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authSession) {
      return;
    }

    void loadUsers(authSession.accessToken);
  }, [authSession]);

  async function loadUsers(accessToken: string) {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = (await response.json().catch(() => null)) as
        | UsersResponse
        | null;

      if (!response.ok || !data?.success || !data.users) {
        setMessage(data?.error || "Gagal mengambil daftar user.");
        return;
      }

      setUsers(data.users);
    } catch {
      setMessage("Gagal terhubung ke server admin.");
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(userId: string, isActive: boolean) {
    if (!authSession) {
      return;
    }

    try {
      setUpdatingUserId(userId);
      setMessage("");

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authSession.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, isActive }),
      });
      const data = (await response.json().catch(() => null)) as
        | UsersResponse
        | null;

      if (!response.ok || !data?.success || !data.user) {
        setMessage(data?.error || "Gagal mengubah status user.");
        return;
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === userId ? data.user! : user))
      );
    } catch {
      setMessage("Gagal terhubung ke server admin.");
    } finally {
      setUpdatingUserId("");
    }
  }

  if (!isSupabaseAuthConfigured()) {
    return (
      <main className="min-h-screen bg-[#070b14] px-4 py-8 text-slate-100">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h1 className="text-2xl font-bold">Admin belum dikonfigurasi</h1>
          <p className="mt-3 text-sm text-slate-400">
            Supabase env belum tersedia.
          </p>
        </section>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b14] text-slate-400">
        Memuat admin...
      </main>
    );
  }

  if (!authSession) {
    return (
      <main className="min-h-screen bg-[#070b14] px-4 py-8 text-slate-100">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h1 className="text-2xl font-bold">Login diperlukan</h1>
          <p className="mt-3 text-sm text-slate-400">
            Login dulu di halaman utama, lalu buka kembali halaman admin ini.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            Ke Halaman Login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-6 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
              FrankLab Admin
            </p>
            <h1 className="mt-1 text-2xl font-bold">Aktivasi User</h1>
            <p className="mt-1 text-sm text-slate-400">
              Login sebagai {authSession.user.email}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              Studio
            </Link>
            <button
              onClick={() => loadUsers(authSession.accessToken)}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Memuat..." : "Refresh"}
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            {message}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] border-b border-slate-800 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            <span>Email</span>
            <span>Status</span>
            <span className="text-right">Aksi</span>
          </div>

          {users.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              {loading ? "Memuat daftar user..." : "Belum ada user."}
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[1.4fr_0.8fr_0.8fr] items-center gap-3 px-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {user.email}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(user.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        user.is_active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {user.is_active ? "Aktif" : "Menunggu"}
                    </span>
                  </div>

                  <div className="text-right">
                    <button
                      onClick={() => updateUser(user.id, !user.is_active)}
                      disabled={updatingUserId === user.id}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${
                        user.is_active
                          ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
                          : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      }`}
                    >
                      {updatingUserId === user.id
                        ? "Menyimpan..."
                        : user.is_active
                          ? "Nonaktifkan"
                          : "Aktifkan"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
