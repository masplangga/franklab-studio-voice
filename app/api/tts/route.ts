import { GoogleGenAI } from "@google/genai";
import { checkActiveUser } from "@/lib/access";
import { GEMINI_VOICES } from "@/lib/voices";

const MAX_TTS_PROMPT_LENGTH = 2400;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;

const allowedVoiceIds = new Set(GEMINI_VOICES.map((voice) => voice.id));
const requestLog = new Map<string, number[]>();

type TtsRequest = {
  text?: unknown;
  voice?: unknown;
};

type GeminiAudioPart = {
  inlineData?: {
    data?: string;
  };
  inline_data?: {
    data?: string;
  };
};

function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitDepth = 16
) {
  const byteRate = sampleRate * channels * (bitDepth / 8);
  const blockAlign = channels * (bitDepth / 8);

  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8);

  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);

  header.write("data", 36);
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

function getClientKey(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

function isRateLimited(key: string) {
  const now = Date.now();
  const recentRequests = (requestLog.get(key) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(key, recentRequests);
    return true;
  }

  requestLog.set(key, [...recentRequests, now]);
  return false;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(req: Request) {
  try {
    const access = await checkActiveUser(req);
    if (!access.ok) {
      return Response.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { success: false, error: "Konfigurasi API belum tersedia." },
        { status: 500 }
      );
    }

    if (isRateLimited(getClientKey(req))) {
      return Response.json(
        { success: false, error: "Terlalu banyak request. Coba lagi sebentar." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as TtsRequest;
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const voice = typeof body.voice === "string" ? body.voice.trim() : "Kore";

    if (!text) {
      return Response.json(
        { success: false, error: "Naskah wajib diisi." },
        { status: 400 }
      );
    }

    if (text.length > MAX_TTS_PROMPT_LENGTH) {
      return Response.json(
        { success: false, error: "Naskah terlalu panjang." },
        { status: 400 }
      );
    }

    if (!allowedVoiceIds.has(voice)) {
      return Response.json(
        { success: false, error: "Model suara tidak valid." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: text,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0] as
      | GeminiAudioPart
      | undefined;
    const audioData = part?.inlineData?.data || part?.inline_data?.data;

    if (!audioData) {
      return Response.json(
        {
          success: false,
          error: "Audio tidak ditemukan pada respons AI.",
        },
        { status: 502 }
      );
    }

    const pcmBuffer = Buffer.from(audioData, "base64");
    const wavBuffer = pcmToWav(pcmBuffer);

    return new Response(wavBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition":
          'attachment; filename="franklab-studio-voice.wav"',
      },
    });
  } catch (error: unknown) {
    console.error("TTS generation failed:", getErrorMessage(error));

    return Response.json(
      {
        success: false,
        error: "Gagal membuat audio. Coba lagi nanti.",
      },
      { status: 500 }
    );
  }
}
