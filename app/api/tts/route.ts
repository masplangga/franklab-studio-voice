import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Halo, balas dengan kata OK",
    });

    return NextResponse.json({
      success: true,
      text: response.text,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
    });
  }
}