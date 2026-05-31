"use client";

import { useState } from "react";
import VoiceCard from "@/components/VoiceCard";
import { GEMINI_VOICES } from "@/lib/voices";

const emotions = [
  { id: "Netral", emoji: "😊" },
  { id: "Ramah", emoji: "🤝" },
  { id: "Bersemangat", emoji: "🔥" },
  { id: "Tenang", emoji: "🌙" },
  { id: "Storytelling", emoji: "📖" },
  { id: "Profesional", emoji: "💼" },
  { id: "Sedih", emoji: "😢" },
  { id: "Serius", emoji: "🎙️" },
  { id: "Whisper", emoji: "🤫" },
];

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
async function generateScript() {
  try {
    setScriptLoading(true);

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

    const data = await res.json();

    if (!data.success) {
      alert("Gagal membuat script");
      return;
    }

    setText(data.script);
  } catch (err) {
    alert("Terjadi error");
  } finally {
    setScriptLoading(false);
  }
}
  async function generateAudio() {
    setLoading(true);
    setAudioUrl("");

    const styledText = `
Bacakan teks berikut dalam bahasa Indonesia.
Gaya emosi: ${emotion}.
Kecepatan bicara: ${speed}x.
Tinggi nada: ${pitch}x.
Gunakan karakter suara: ${selectedVoice.name}, ${selectedVoice.description}.

Teks:
${text}
`;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: styledText, voice: selectedVoice.id }),
      });

      if (!res.ok) {
        alert("Gagal membuat suara.");
        return;
      }

      const blob = await res.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch {
      alert("Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#030817] text-slate-100 p-4 md:p-6">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,#1d4ed820,transparent_35%),radial-gradient(circle_at_bottom_right,#4f46e520,transparent_35%)]" />

      <div className="relative max-w-7xl mx-auto space-y-5">
        <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/40">
              🎙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold">
                  FrankLab Studio Voice PRO
                </h1>
                <span className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-1 rounded-md">
                  NEURAL-TTS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Advanced Neural Speech Synthesis Studio & Ekspresi
              </p>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl text-xs">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-slate-400">FrankLab Voice PRO 1.2:</span>
            <span className="text-blue-300 font-bold">ONLINE</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-5">
            <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl" />

              <div className="relative">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-[11px] text-blue-300 uppercase tracking-widest font-bold">
                    <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
  <div className="mb-5">
    <h2 className="text-lg font-bold text-blue-300">
      ✨ AI COPYWRITER & SCRIPT GENERATOR
    </h2>

    <p className="text-sm text-slate-400 mt-1">
      Buat script iklan, UGC produk, atau narasi otomatis.
    </p>
  </div>

  <div className="grid md:grid-cols-2 gap-4 mb-4">
    <input
      value={productName}
      onChange={(e) => setProductName(e.target.value)}
      placeholder="Nama Produk / Layanan"
      className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3"
    />

    <input
      value={productDesc}
      onChange={(e) => setProductDesc(e.target.value)}
      placeholder="Deskripsi / Kelebihan Singkat"
      className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3"
    />
  </div>

  <div className="grid md:grid-cols-3 gap-4">
    <select
      value={scriptStyle}
      onChange={(e) => setScriptStyle(e.target.value)}
      className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3"
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
      onChange={(e) => setScriptLength(e.target.value)}
      className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3"
    >
      <option>10 Detik</option>
      <option>30 Detik</option>
      <option>60 Detik</option>
    </select>

    <button
      onClick={generateScript}
      disabled={scriptLoading}
      className="bg-blue-600 hover:bg-blue-500 rounded-xl font-bold"
    >
      {scriptLoading
        ? "Membuat Script..."
        : "✨ GENERATE SCRIPT IKLAN"}
    </button>
  </div>
</section>
                      Manuskrip Suara
                    </p>
                    <h2 className="text-xl font-bold mt-1">Input Teks</h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    {text.length} / 1500 karakter
                  </p>
                </div>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={1500}
                  placeholder="Ketik atau tempelkan naskah di sini..."
                  className="w-full min-h-[230px] bg-transparent text-lg leading-relaxed outline-none resize-none text-slate-200 placeholder:text-slate-700"
                />

                <div className="pt-4 border-t border-slate-800 flex justify-between">
                  <button
                    onClick={() => setText("")}
                    className="text-xs px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Bersihkan
                  </button>

                  <button
                    onClick={() =>
                      setText(
                        "Hari berganti hari, rahasia peradaban kuno akhirnya mulai terkuak. Apa yang sebenarnya tersimpan di dasar laut?"
                      )
                    }
                    className="text-xs px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Reset Contoh
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-sm font-bold">Ekspresi Emosional</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Pilih gaya emosi untuk intonasi suara.
                  </p>
                </div>
                <span className="text-[10px] text-blue-300 border border-blue-500/20 px-3 py-1 rounded-full bg-blue-500/5">
                  9 Variasi Ekspresi
                </span>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
                {emotions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setEmotion(item.id)}
                    className={`rounded-2xl border p-3 text-center transition ${
                      emotion === item.id
                        ? "border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20"
                        : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-2xl">{item.emoji}</div>
                    <div className="text-[11px] mt-2">{item.id}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                <div className="flex justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase">
                    Tempo / Kecepatan Suara
                  </h3>
                  <span className="text-blue-300 text-xs font-mono">
                    {speed.toFixed(1)}x
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Atur pelafalan lebih cepat atau lebih lambat.
                </p>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                <div className="flex justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase">
                    Nada / Pitch Frekuensi
                  </h3>
                  <span className="text-blue-300 text-xs font-mono">
                    {pitch.toFixed(1)}x
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Suara rendah, natural, atau sedikit tinggi.
                </p>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col">
            <div className="mb-4">
              <h2 className="text-sm font-bold">Perpustakaan Model Suara</h2>
              <p className="text-xs text-slate-400 mt-1">
                Pilih model karakter vokal Neural premium.
              </p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
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

            <div className="pt-4 mt-4 border-t border-slate-800">
              <button
                onClick={generateAudio}
                disabled={loading || !text}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-sm tracking-wide shadow-xl shadow-blue-700/30 transition"
              >
                {loading ? "Menyusun Audio Neural..." : "⚡ GENERATE AUDIO SUARA"}
              </button>
            </div>

            {audioUrl && (
              <div className="mt-5 space-y-3">
                <audio controls src={audioUrl} className="w-full" />
                <a
                  href={audioUrl}
                  download="franklab-studio-voice.wav"
                  className="block text-center bg-slate-950 hover:bg-slate-800 border border-slate-800 py-3 rounded-xl text-emerald-400 text-sm"
                >
                  Download WAV
                </a>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}