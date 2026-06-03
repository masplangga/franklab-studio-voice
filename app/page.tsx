"use client";

import { useEffect, useMemo, useState } from "react";
import VoiceCard from "@/components/VoiceCard";
import { GEMINI_VOICES } from "@/lib/voices";

const MAX_TEXT_LENGTH = 1500;
const HISTORY_KEY = "franklab-generation-history";

const emotions = [
  { id: "Netral", label: "Netral" },
  { id: "Ramah", label: "Ramah" },
  { id: "Bersemangat", label: "Bersemangat" },
  { id: "Tenang", label: "Tenang" },
  { id: "Storytelling", label: "Storytelling" },
  { id: "Profesional", label: "Profesional" },
  { id: "Sedih", label: "Sedih" },
  { id: "Serius", label: "Serius" },
  { id: "Whisper", label: "Whisper" },
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
  const [emotion, setEmotion] = useState("Netral");
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
  const [history, setHistory] = useState<GenerationHistory[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(HISTORY_KEY);
        if (saved) {
          setHistory(JSON.parse(saved) as GenerationHistory[]);
        }
      } catch {
        setHistory([]);
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

  const canGenerateScript = productName.trim() && productDesc.trim();
  const canGenerateAudio = text.trim().length > 0 && !loading;

  function saveHistory(item: GenerationHistory) {
    const nextHistory = [item, ...history].slice(0, 5);
    setHistory(nextHistory);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  }

  async function generateScript() {
    if (!canGenerateScript) {
      setErrorMessage("Isi nama produk dan deskripsi singkat terlebih dahulu.");
      return;
    }

    try {
      setScriptLoading(true);
      setErrorMessage("");

      const res = await fetch("/api/script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        error?: string;
      };

      if (!res.ok || !data.success || !data.script) {
        setErrorMessage(data.error || "Gagal membuat script.");
        return;
      }

      setText(data.script.slice(0, MAX_TEXT_LENGTH));
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

    setLoading(true);
    setErrorMessage("");

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
        headers: { "Content-Type": "application/json" },
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
      setAudioUrl(nextAudioUrl);
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

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/80">
        <header className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
              AI Voice SaaS Studio
            </p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              FrankLab Studio Voice PRO
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Buat script, pilih karakter suara, lalu ekspor voice over siap pakai.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-center">
            <div>
              <p className="text-lg font-bold text-white">5</p>
              <p className="text-[11px] text-slate-500">Riwayat lokal</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">10</p>
              <p className="text-[11px] text-slate-500">Model suara</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{MAX_TEXT_LENGTH}</p>
              <p className="text-[11px] text-slate-500">Karakter</p>
            </div>
          </div>
        </header>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 md:px-6 lg:grid-cols-12">
        <section className="space-y-5 lg:col-span-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Langkah 1
                </p>
                <h2 className="mt-1 text-lg font-bold">AI Copywriter</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Ubah deskripsi produk menjadi naskah iklan singkat.
                </p>
              </div>
              <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                Siap untuk voice over
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">
                  Nama produk atau layanan
                </span>
                <input
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="Contoh: Kopi Susu Arunika"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-400"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">
                  Kelebihan singkat
                </span>
                <input
                  value={productDesc}
                  onChange={(event) => setProductDesc(event.target.value)}
                  placeholder="Contoh: creamy, gula aren asli, siap antar"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-blue-400"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <select
                value={scriptStyle}
                onChange={(event) => setScriptStyle(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-400"
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
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-400"
              >
                <option>10 Detik</option>
                <option>30 Detik</option>
                <option>60 Detik</option>
              </select>

              <button
                onClick={generateScript}
                disabled={scriptLoading || !canGenerateScript}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {scriptLoading ? "Membuat..." : "Generate Script"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Langkah 2
                </p>
                <h2 className="mt-1 text-lg font-bold">Editor Naskah</h2>
              </div>
              <div className="min-w-28 text-right">
                <p className="text-xs text-slate-400">
                  {text.length} / {MAX_TEXT_LENGTH}
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-800">
                  <div
                    className="h-1.5 rounded-full bg-blue-500"
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
              className="min-h-64 w-full resize-none rounded-xl border border-slate-800 bg-slate-950 p-4 text-base leading-relaxed text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-400"
            />

            <div className="mt-4 flex flex-wrap justify-between gap-3">
              <button
                onClick={() => setText("")}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                Bersihkan
              </button>

              <button
                onClick={() =>
                  setText(
                    "Hari berganti hari, rahasia peradaban kuno akhirnya mulai terkuak. Apa yang sebenarnya tersimpan di dasar laut?"
                  )
                }
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
              >
                Pakai Contoh
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Langkah 3
                </p>
                <h2 className="mt-1 text-lg font-bold">Ekspresi</h2>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {emotions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setEmotion(item.id)}
                    className={`min-h-12 rounded-xl border px-3 py-2 text-sm transition ${
                      emotion === item.id
                        ? "border-blue-400 bg-blue-500/15 text-blue-100"
                        : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Langkah 4
                </p>
                <h2 className="mt-1 text-lg font-bold">Kontrol Suara</h2>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Kecepatan</span>
                    <span className="font-mono text-blue-300">
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
                    className="w-full accent-blue-500"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Pitch</span>
                    <span className="font-mono text-blue-300">
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
                    className="w-full accent-blue-500"
                  />
                </label>
              </div>
            </section>
          </div>
        </section>

        <aside className="space-y-5 lg:col-span-4">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-4">
              <h2 className="text-lg font-bold">Model Suara</h2>
              <p className="mt-1 text-sm text-slate-400">
                Pilih karakter vokal untuk hasil audio.
              </p>
            </div>

            <div className="max-h-[470px] space-y-3 overflow-y-auto pr-1">
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

          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <h2 className="text-lg font-bold">Generate Audio</h2>
            <p className="mt-1 text-sm text-slate-400">
              Suara: {selectedVoice.name} - {emotion}
            </p>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <button
              onClick={generateAudio}
              disabled={!canGenerateAudio}
              className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Menyusun Audio..." : "Generate Audio"}
            </button>

            {audioUrl && (
              <div className="mt-5 space-y-3">
                <audio controls src={audioUrl} className="w-full" />
                <a
                  href={audioUrl}
                  download="franklab-studio-voice.wav"
                  className="block rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-emerald-300 transition hover:bg-slate-800"
                >
                  Download WAV
                </a>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Riwayat Lokal</h2>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                MVP
              </span>
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-slate-500">
                Hasil audio yang dibuat di browser ini akan muncul di sini.
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                  >
                    <p className="line-clamp-1 text-sm font-semibold">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
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
