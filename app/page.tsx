"use client";

import { useState } from "react";

const voices = [
  { name: "Arita", desc: "Ramah & Ceria (Wanita)", value: "Kore" },
  { name: "Siti", desc: "Lembut & Anggun (Wanita)", value: "Aoede" },
  { name: "Agus", desc: "Dewasa & Natural (Pria)", value: "Puck" },
  { name: "Dewi", desc: "Energik & Lugas (Wanita)", value: "Kore" },
  { name: "Tina", desc: "Profesional & Jelas (Wanita)", value: "Aoede" },
  { name: "Maya", desc: "Inspiratif & Hangat (Wanita)", value: "Kore" },
  { name: "Rian", desc: "Muda & Bersemangat (Pria)", value: "Puck" },
  { name: "Indah", desc: "Halus & Menenangkan (Wanita)", value: "Aoede" },
  { name: "Gading", desc: "Berat & Maskulin (Pria)", value: "Fenrir" },
  { name: "Shinta", desc: "Tegas & Berani (Wanita)", value: "Kore" },
  { name: "Bayu", desc: "Serius & Bijak (Pria)", value: "Charon" },
  { name: "Adi", desc: "Calm & Bersahabat (Pria)", value: "Puck" },
  { name: "Eko", desc: "Santai & Edukatif (Pria)", value: "Charon" },
  { name: "Laura", desc: "Anggun & Elegan (Wanita)", value: "Aoede" },
];

const emotions = [
  "Netral",
  "Ramah",
  "Bersemangat",
  "Tenang",
  "Storytelling",
  "Profesional",
  "Sedih",
  "Serius",
  "Whisper",
];

export default function Home() {
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(voices[0]);
  const [emotion, setEmotion] = useState("Netral");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateAudio() {
    setLoading(true);
    setAudioUrl("");

    const styledText = `
Bacakan teks berikut dalam bahasa Indonesia.
Gaya emosi: ${emotion}.
Kecepatan bicara: ${speed}x.
Tinggi nada: ${pitch}.
Gunakan karakter suara: ${selectedVoice.name}, ${selectedVoice.desc}.

Teks:
${text}
`;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: styledText,
          voice: selectedVoice.value,
        }),
      });

      if (!res.ok) {
        alert("Gagal membuat suara.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch {
      alert("Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              <span className="text-blue-400">FrankLab</span> Studio Voice
            </h1>
            <p className="text-slate-400 mt-1">
              Text to Speech Studio by FrankLab
            </p>
          </div>

          <div className="hidden md:flex gap-3">
            <button className="border border-blue-800 px-5 py-3 rounded-xl text-blue-300">
              Help
            </button>
            <button className="border border-blue-800 px-5 py-3 rounded-xl text-blue-300">
              History
            </button>
          </div>
        </header>

        <section className="bg-black/40 border border-blue-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-blue-400 font-bold text-xl mb-4">Input Teks</h2>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={5000}
            placeholder="Tulis naskah Anda di sini..."
            className="w-full h-44 bg-slate-950/80 border border-slate-700 rounded-xl p-4 outline-none focus:border-blue-500 text-slate-100"
          />

          <div className="flex justify-between items-center mt-3 text-sm text-slate-400">
            <span>{text.length} / 5000 karakter</span>
            <button
              onClick={() => setText("")}
              className="bg-blue-700 hover:bg-blue-600 text-white px-5 py-2 rounded-lg"
            >
              Bersihkan
            </button>
          </div>
        </section>

        <section className="bg-black/40 border border-blue-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-blue-400 font-bold text-xl mb-5">
            Pilih Karakter Suara (14)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {voices.map((voice) => (
              <button
                key={voice.name}
                onClick={() => setSelectedVoice(voice)}
                className={`text-left border rounded-xl p-4 transition ${
                  selectedVoice.name === voice.name
                    ? "border-blue-400 bg-blue-600/30 shadow-lg shadow-blue-500/20"
                    : "border-slate-700 bg-slate-950/60 hover:border-blue-700"
                }`}
              >
                <div className="font-bold">{voice.name}</div>
                <div className="text-sm text-slate-400">{voice.desc}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-black/40 border border-blue-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-blue-400 font-bold text-xl mb-5">
            Pengaturan Gaya Bicara
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-semibold">Kecepatan Bicara</label>
                  <span className="bg-blue-900 px-3 py-1 rounded-lg">
                    {speed}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-semibold">Tinggi Nada</label>
                  <span className="bg-blue-900 px-3 py-1 rounded-lg">
                    {pitch}
                  </span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="1"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4">Ekspresi Emosi</h3>
              <div className="grid grid-cols-3 gap-3">
                {emotions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setEmotion(item)}
                    className={`py-4 rounded-xl border text-sm font-bold ${
                      emotion === item
                        ? "bg-blue-600 border-blue-300"
                        : "bg-slate-950/60 border-slate-700 hover:border-blue-600"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-black/40 border border-blue-800 rounded-2xl p-6 shadow-2xl">
          <button
            onClick={generateAudio}
            disabled={loading || !text}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-blue-600/30"
          >
            {loading ? "Membuat Suara..." : "Generate Suara"}
          </button>

          {audioUrl && (
            <div className="mt-6 space-y-4">
              <audio controls src={audioUrl} className="w-full" />
              <a
                href={audioUrl}
                download="franklab-studio-voice.wav"
                className="block text-center bg-slate-900 hover:bg-slate-800 border border-blue-800 py-3 rounded-xl"
              >
                Download Audio
              </a>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}