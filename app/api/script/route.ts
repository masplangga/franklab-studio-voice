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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    if (!response.text) {
      return NextResponse.json(
        { success: false, error: "Script tidak ditemukan pada respons AI." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      script: response.text.trim(),
    });
  } catch (error: unknown) {
    console.error("Script generation failed:", getErrorMessage(error));

    return NextResponse.json(
      { success: false, error: "Gagal membuat script. Coba lagi nanti." },
      { status: 500 }
    );
  }
}
