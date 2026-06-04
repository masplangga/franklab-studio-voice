"use client";

import { useEffect, useMemo, useState } from "react";
import AuthPanel from "@/components/AuthPanel";
import VoiceCard from "@/components/VoiceCard";
import {
  AUTH_STORAGE_KEY,
  type AuthSession,
  isSupabaseAuthConfigured,
} from "@/lib/auth";
import { GEMINI_VOICES } from "@/lib/voices";

const MAX_TEXT_LENGTH = 1500;
const HISTORY_KEY = "franklab-generation-history";
const adminContactUrl = process.env.NEXT_PUBLIC_ADMIN_CONTACT_URL || "";

const emotions = [
  { id: "Alami", label: "Alami", icon: "🗣️" },
  { id: "Ceria", label: "Ceria", icon: "😊" },
  { id: "Tenang", label: "Tenang", icon: "🧘" },
  { id: "Sedih", label: "Sedih", icon: "😢" },
  { id: "Marah", label: "Marah", icon: "😡" },
  { id: "Berbisik", label: "Berbisik", icon: "🤫" },
  { id: "Semangat", label: "Semangat", icon: "🥳" },
  { id: "Robot", label: "Robot", icon: "🤖" },
  { id: "Dramatis", label: "Dramatis", icon: "🎭" },
];

type GenerationHistory = {
  id: string;
  createdAt: string;
  title: string;
  voiceName: string;
  emotion: string;
  characterCount: number;
};

export default function Home() {
  const [text, setText] = useState(
    "Selamat pagi semuanya! Selamat datang di FrankLab Studio Voice PRO. Mari bersama-sama menciptakan karya tulisan bernada indah dan berjiwa."
  );
  const [selectedVoice, setSelectedVoice] = useState(GEMINI_VOICES[0]);
  const [emotion, setEmotion] = useState("Alami");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [scriptStyle, setScriptStyle] = useState("Profesional");
  const [scriptLength, setScriptLength] = useState("30 Detik");
  const [scriptLoading, setScriptLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [modelMessage, setModelMessage] = useState("");
  const [history, setHistory] = useState<GenerationHistory[]>([]);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [accountActive, setAccountActive] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedAuth) {
          setAuthSession(JSON.parse(savedAuth) as AuthSession);
        }

        const saved = window.localStorage.getItem(HISTORY_KEY);
        if (saved) {
          setHistory(JSON.parse(saved) as GenerationHistory[]);
        }
      } catch {
        setHistory([]);
      } finally {
        setAuthReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const usagePercent = useMemo(() => {
    return Math.min(100, Math.round((text.length / MAX_TEXT_LENGTH) * 100));
  }, [text.length]);

  const hasScriptFields = Boolean(productName.trim() && productDesc.trim());
  const canGenerateScript = hasScriptFields && accountActive;
  const canGenerateAudio = text.trim().length > 0 && !loading && accountActive;
  const authHeaders: Record<string, string> = authSession
    ? { Authorization: `Bearer ${authSession.accessToken}` }
    : {};

  function handleAuthenticated(session: AuthSession) {
    setAuthSession(session);
    setAccountActive(false);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }

  function logout() {
    setAuthSession(null);
    setAccountActive(false);
    setAudioUrl("");
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  useEffect(() => {
    if (!authSession) {
      return;
    }

    let cancelled = false;
    const accessToken = authSession.accessToken;

    async function loadAccountStatus() {
      try {
        setAccountLoading(true);
        const response = await fetch("/api/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = (await response.json().catch(() => null)) as
          | { isActive?: boolean; error?: string }
          | null;

        if (!cancelled) {
          setAccountActive(response.ok && data?.isActive === true);
        }
      } catch {
        if (!cancelled) {
          setAccountActive(false);
        }
      } finally {
        if (!cancelled) {
          setAccountLoading(false);
        }
      }
    }

    void loadAccountStatus();

    return () => {
      cancelled = true;
    };
  }, [authSession]);

  function saveHistory(item: GenerationHistory) {
    const nextHistory = [item, ...history].slice(0, 5);
    setHistory(nextHistory);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  }

  async function generateScript() {
    if (!hasScriptFields) {
      setErrorMessage("Isi nama produk dan deskripsi singkat terlebih dahulu.");
      return;
    }

    if (!accountActive) {
      setErrorMessage("Akun kamu belum aktif. Hubungi admin untuk aktivasi.");
      return;
    }

    try {
      setScriptLoading(true);
      setErrorMessage("");
      setModelMessage("");

      const res = await fetch("/api/script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          productName,
          productDesc,
          scriptStyle,
          scriptLength,
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        script?: string;
        modelUsed?: string;
        error?: string;
      };

      if (!res.ok || !data.success || !data.script) {
        setErrorMessage(data.error || "Gagal membuat script.");
        return;
      }

      setText(data.script.slice(0, MAX_TEXT_LENGTH));
      if (data.modelUsed) {
        setModelMessage(`Script dibuat dengan ${data.modelUsed}.`);
      }
    } catch {
      setErrorMessage("Terjadi error saat membuat script.");
    } finally {
      setScriptLoading(false);
    }
  }

  async function generateAudio() {
    if (!text.trim()) {
      setErrorMessage("Masukkan naskah terlebih dahulu.");
      return;
    }

    if (!accountActive) {
      setErrorMessage("Akun kamu belum aktif. Hubungi admin untuk aktivasi.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setModelMessage("");

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
    }

    const styledText = `
Bacakan teks berikut dalam bahasa Indonesia.
Gaya emosi: ${emotion}.
Kecepatan bicara: ${speed}x.
Tinggi nada: ${pitch}x.
Gunakan karakter suara: ${selectedVoice.name}, ${selectedVoice.description}.

Teks:
${text.trim()}
`;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ text: styledText, voice: selectedVoice.id }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setErrorMessage(data?.error || "Gagal membuat audio.");
        return;
      }

      const blob = await res.blob();
      const nextAudioUrl = URL.createObjectURL(blob);
      const modelUsed = res.headers.get("X-FrankLab-Model-Used");
      setAudioUrl(nextAudioUrl);
      if (modelUsed) {
        setModelMessage(`Audio dibuat dengan ${modelUsed}.`);
      }
      saveHistory({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        title: text.trim().split(/\s+/).slice(0, 7).join(" "),
        voiceName: selectedVoice.name,
        emotion,
        characterCount: text.length,
      });
    } catch {
      setErrorMessage("Terjadi error saat membuat audio.");
    } finally {
      setLoading(false);
    }
  }

  if (!isSupabaseAuthConfigured()) {
    return (
      <main className="min-h-screen bg-[#070b14] px-4 py-8 text-slate-100">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
            Setup Auth
          </p>
          <h1 className="mt-2 text-2xl font-bold">Supabase belum dikonfigurasi</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Untuk mengaktifkan login, tambahkan environment variable berikut di
            lokal dan Vercel, lalu restart/deploy ulang aplikasi.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200">
            NEXT_PUBLIC_SUPABASE_URL=https://project-id.supabase.co{"\n"}
            NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-key-kamu
          </pre>
          <p className="mt-4 text-sm text-slate-500">
            Gemini API tetap memakai GEMINI_API_KEY seperti sebelumnya.
          </p>
        </section>
      </main>
    );
  }

  if (!authReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b14] text-slate-400">
        Memuat akun...
      </main>
    );
  }

  if (!authSession) {
    return <AuthPanel onAuthenticated={handleAuthenticated} />;
  }

  return (
    <main className="min-h-screen bg-[#050918] px-4 py-5 text-[#f7f8ff] md:px-5">
      <header className="mx-auto flex max-w-[1400px] flex-col gap-5 rounded-[24px] border border-[#1d2844] bg-[#0c1328] px-4 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.34)] md:flex-row md:items-center md:justify-between md:px-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#6548ff] text-lg font-black shadow-[0_16px_38px_rgba(101,72,255,0.38)]">
            mic
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-white md:text-[28px]">
                FrankLab Studio Voice PRO
              </h1>
              <span className="rounded-md border border-[#5d55ff]/45 bg-[#4436d5]/18 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-[#a8a6ff]">
                NEURAL-TTS
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-[#91a0bf]">
              Advanced Neural Speech Synthesis Studio & Ekspresi
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#9aa8c9]">
              <span className="rounded-full border border-[#23304e] bg-[#111a32] px-3 py-1">
                {authSession.user.email}
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-[#33405e] px-3 py-1 text-[#d7def5] transition hover:bg-[#16213d]"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>

        <div className="flex w-fit items-center gap-3 rounded-[18px] border border-[#22304e] bg-[#080e20] px-4 py-3 text-xs">
          <span className="h-2 w-2 rounded-full bg-[#00a878]" />
          <span className="text-[#8e9dbd]">FrankLab Voice PRO 1.2:</span>
          <span className="font-black tracking-[0.18em] text-[#9d9cff]">
            ONLINE
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 py-5 lg:grid-cols-[1fr_440px]">
        <section className="space-y-5">
          {!accountActive && (
            <div className="rounded-[22px] border border-amber-500/35 bg-amber-500/10 p-5 text-amber-100">
              <h2 className="text-lg font-black">
                {accountLoading
                  ? "Memeriksa status akun..."
                  : "Akun menunggu aktivasi"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-100/85">
                Kamu sudah login, tetapi fitur generate belum aktif. Hubungi admin
                untuk aktivasi akun setelah pembayaran atau persetujuan manual.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {adminContactUrl ? (
                  <a
                    href={adminContactUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300"
                  >
                    Hubungi Admin
                  </a>
                ) : (
                  <span className="rounded-xl border border-amber-400/30 px-4 py-2 text-sm text-amber-100/80">
                    Hubungi admin untuk aktivasi
                  </span>
                )}
                <span className="text-xs text-amber-100/60">
                  Email akun: {authSession.user.email}
                </span>
              </div>
            </div>
          )}

          <section className="rounded-[24px] border border-[#1d2844] bg-[#111a30] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7d86ff]">
                  Manuskrip Suara (Teks)
                </p>
              </div>
              <div className="min-w-36 text-right">
                <p className="font-mono text-xs text-[#7f8db0]">
                  {text.length} / {MAX_TEXT_LENGTH} karakter
                </p>
                <div className="mt-3 h-1.5 rounded-full bg-[#26334f]">
                  <div
                    className="h-1.5 rounded-full bg-[#377dff]"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </div>

            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={MAX_TEXT_LENGTH}
              placeholder="Ketik atau tempelkan naskah di sini..."
              className="min-h-[150px] w-full resize-none bg-transparent text-[20px] font-medium leading-8 text-white outline-none placeholder:text-[#53607e]"
            />

            <div className="mt-6 border-t border-[#22304d] pt-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setText("")}
                  className="rounded-xl border border-[#24324f] bg-[#142039] px-4 py-2 text-xs font-semibold text-[#aab7d5] transition hover:bg-[#1a2845]"
                >
                  Bersihkan
                </button>
                <button
                  onClick={() =>
                    setText(
                      "Hari berganti hari, rahasia peradaban kuno akhirnya mulai terkuak. Apa yang sebenarnya tersimpan di dasar laut?"
                    )
                  }
                  className="rounded-xl border border-[#24324f] bg-[#142039] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1a2845]"
                >
                  Reset Contoh
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-[#1d2844] bg-[#111a30] p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white">
                  Ekspresi Emosional
                </h2>
                <p className="mt-1 text-xs font-medium text-[#91a0bf]">
                  Berikan getaran perasaan yang disesuaikan dalam intonasi ucapan.
                </p>
              </div>
              <span className="rounded-xl border border-[#29365a] bg-[#17213b] px-3 py-1.5 font-mono text-xs text-[#a8b7d8]">
                9 Variasi Ekspresi
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 md:grid-cols-5 xl:grid-cols-9">
              {emotions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setEmotion(item.id)}
                  className={`flex min-h-[82px] flex-col items-center justify-center rounded-[16px] border p-3 text-center transition ${
                    emotion === item.id
                      ? "border-[#6d5cff] bg-[#1a2350] shadow-[0_0_0_1px_rgba(109,92,255,0.35)]"
                      : "border-[#1e2b49] bg-[#0b1225] hover:border-[#3a4770]"
                  }`}
                >
                  <span
                    className={`text-lg font-black ${
                      emotion === item.id ? "text-[#b9b5ff]" : "text-[#d7def3]"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="mt-2 text-xs font-bold text-[#cbd5ed]">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#1d2844] bg-[#111a30] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7d86ff]">
                  AI Copywriter
                </p>
                <h2 className="mt-1 text-base font-black text-white">
                  Script Generator
                </h2>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                Siap VO
              </span>
            </div>
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="Nama produk / layanan"
                  className="rounded-xl border border-[#24324f] bg-[#090f21] px-4 py-3 text-sm text-white outline-none placeholder:text-[#52617d] focus:border-[#6d5cff]"
                />
                <input
                  value={productDesc}
                  onChange={(event) => setProductDesc(event.target.value)}
                  placeholder="Kelebihan singkat"
                  className="rounded-xl border border-[#24324f] bg-[#090f21] px-4 py-3 text-sm text-white outline-none placeholder:text-[#52617d] focus:border-[#6d5cff]"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <select
                  value={scriptStyle}
                  onChange={(event) => setScriptStyle(event.target.value)}
                  className="rounded-xl border border-[#24324f] bg-[#090f21] px-3 py-3 text-sm text-white outline-none focus:border-[#6d5cff]"
                >
                  <option>Profesional</option>
                  <option>Santai</option>
                  <option>Storytelling</option>
                  <option>UGC</option>
                  <option>Hard Selling</option>
                  <option>Soft Selling</option>
                </select>
                <select
                  value={scriptLength}
                  onChange={(event) => setScriptLength(event.target.value)}
                  className="rounded-xl border border-[#24324f] bg-[#090f21] px-3 py-3 text-sm text-white outline-none focus:border-[#6d5cff]"
                >
                  <option>10 Detik</option>
                  <option>30 Detik</option>
                  <option>60 Detik</option>
                </select>
                <button
                  onClick={generateScript}
                  disabled={scriptLoading || !canGenerateScript}
                  className="rounded-xl bg-[#2f63e9] px-4 py-3 text-sm font-black text-white transition hover:bg-[#3f73ff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {scriptLoading ? "Membuat..." : "Generate Script"}
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#1d2844] bg-[#111a30] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-black text-white">Kontrol Suara</h2>
                <span className="rounded-full border border-[#273554] px-3 py-1 font-mono text-xs text-[#8796b7]">
                  {speed.toFixed(1)}x / {pitch.toFixed(1)}x
                </span>
              </div>
              <div className="space-y-5">
                <label className="block">
                  <div className="mb-2 flex justify-between text-sm text-[#b5c1dd]">
                    <span>Kecepatan</span>
                    <span className="font-mono text-[#8c99ff]">
                      {speed.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speed}
                    onChange={(event) => setSpeed(Number(event.target.value))}
                    className="w-full accent-[#6d5cff]"
                  />
                </label>
                <label className="block">
                  <div className="mb-2 flex justify-between text-sm text-[#b5c1dd]">
                    <span>Pitch</span>
                    <span className="font-mono text-[#8c99ff]">
                      {pitch.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={pitch}
                    onChange={(event) => setPitch(Number(event.target.value))}
                    className="w-full accent-[#6d5cff]"
                  />
                </label>
              </div>
            </div>
          </section>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
          <section className="rounded-[24px] border border-[#1d2844] bg-[#111a30] p-5">
            <div className="mb-4">
              <h2 className="text-lg font-black text-white">
                Perpustakaan Model Suara
              </h2>
              <p className="mt-1 text-xs font-medium leading-5 text-[#91a0bf]">
                Pilih model karakter vokal Neural premium untuk drama, pengumuman,
                atau presentasi Anda.
              </p>
            </div>

            <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
              {GEMINI_VOICES.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice)}
                  className="block w-full text-left"
                >
                  <VoiceCard
                    name={voice.name}
                    gender={voice.gender}
                    description={voice.description}
                    active={selectedVoice.id === voice.id}
                  />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-[#1d2844] bg-[#111a30] p-5">
            <h2 className="text-lg font-black text-white">Generate Audio</h2>
            <p className="mt-1 text-sm text-[#91a0bf]">
              Suara: {selectedVoice.name} - {emotion}
            </p>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            {modelMessage && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                {modelMessage}
              </div>
            )}

            <button
              onClick={generateAudio}
              disabled={!canGenerateAudio}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f63e9] px-5 py-4 text-sm font-black uppercase tracking-wide text-white shadow-[0_18px_48px_rgba(47,99,233,0.28)] transition hover:bg-[#3f73ff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Menyusun Audio..." : "Generate Audio Suara"}
            </button>

            {audioUrl && (
              <div className="mt-5 space-y-3">
                <audio controls src={audioUrl} className="w-full" />
                <a
                  href={audioUrl}
                  download="franklab-studio-voice.wav"
                  className="block rounded-xl border border-[#24324f] bg-[#090f21] px-4 py-3 text-center text-sm font-bold text-emerald-300 transition hover:bg-[#142039]"
                >
                  Download WAV
                </a>
              </div>
            )}
          </section>

          <section className="rounded-[24px] border border-[#1d2844] bg-[#111a30] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Riwayat Lokal</h2>
              <span className="rounded-full border border-[#273554] px-3 py-1 text-xs text-[#8796b7]">
                MVP
              </span>
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-[#657393]">
                Hasil audio yang dibuat di browser ini akan muncul di sini.
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#1e2b49] bg-[#090f21] p-3"
                  >
                    <p className="line-clamp-1 text-sm font-bold text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-[#7383a4]">
                      {item.voiceName} - {item.emotion} - {item.characterCount} karakter
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
