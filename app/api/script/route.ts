import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { checkActiveUser } from "@/lib/access";

const MAX_FIELD_LENGTH = 400;
const allowedStyles = new Set([
  "Profesional",
  "Santai",
  "Storytelling",
  "UGC",
  "Hard Selling",
  "Soft Selling",
]);
const allowedLengths = new Set(["10 Detik", "30 Detik", "60 Detik"]);
const SCRIPT_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3-flash",
  "gemini-3.5-flash",
];

type ScriptRequest = {
  productName?: unknown;
  productDesc?: unknown;
  scriptStyle?: unknown;
  scriptLength?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, MAX_FIELD_LENGTH) : "";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function generateScriptWithFallback(ai: GoogleGenAI, prompt: string) {
  let lastError = "";

  for (const model of SCRIPT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      if (response.text?.trim()) {
        return {
          model,
          text: response.text.trim(),
        };
      }

      lastError = `Model ${model} tidak mengembalikan script.`;
    } catch (error: unknown) {
      lastError = getErrorMessage(error);
      console.warn(`Script model fallback: ${model} failed`, lastError);
    }
  }

  throw new Error(lastError || "Semua model script gagal.");
}

export async function POST(req: Request) {
  try {
    const access = await checkActiveUser(req);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Konfigurasi API belum tersedia." },
        { status: 500 }
      );
    }

    const body = (await req.json()) as ScriptRequest;
    const productName = cleanText(body.productName);
    const productDesc = cleanText(body.productDesc);
    const scriptStyle = cleanText(body.scriptStyle) || "Profesional";
    const scriptLength = cleanText(body.scriptLength) || "30 Detik";

    if (!productName || !productDesc) {
      return NextResponse.json(
        { success: false, error: "Nama produk dan deskripsi wajib diisi." },
        { status: 400 }
      );
    }

    if (!allowedStyles.has(scriptStyle) || !allowedLengths.has(scriptLength)) {
      return NextResponse.json(
        { success: false, error: "Pilihan gaya atau durasi tidak valid." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
Buatkan script iklan bahasa Indonesia.

Produk:
${productName}

Kelebihan:
${productDesc}

Gaya:
${scriptStyle}

Durasi:
${scriptLength}

Aturan:
- Natural
- Tidak terlalu formal
- Langsung siap dibacakan voice over
- Tanpa judul
- Tanpa bullet point
`;

    const result = await generateScriptWithFallback(ai, prompt);

    return NextResponse.json(
      {
        success: true,
        script: result.text,
        modelUsed: result.model,
      },
      {
        headers: {
          "X-FrankLab-Model-Used": result.model,
        },
      }
    );
  } catch (error: unknown) {
    console.error("Script generation failed:", getErrorMessage(error));

    return NextResponse.json(
      { success: false, error: "Gagal membuat script. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
