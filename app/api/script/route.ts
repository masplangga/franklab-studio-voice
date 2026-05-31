import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const {
      productName,
      productDesc,
      scriptStyle,
      scriptLength,
    } = await req.json();

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
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

    return NextResponse.json({
      success: true,
      script: response.text,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
    });
  }
}