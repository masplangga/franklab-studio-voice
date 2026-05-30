import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: text,
      config: {
        responseModalities: ["TEXT"],
      },
    });

    return NextResponse.json({
      success: true,
      result: response.text,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
    });
  }
}