import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    apiKeyExists: !!process.env.GEMINI_API_KEY,
    apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
    apiKeyValue: JSON.stringify(process.env.GEMINI_API_KEY),
  });
}
export async function POST(req: Request) {
  try {
    const { text, voice } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Teks masih kosong." }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [
        {
          parts: [
            {
              text: `Say in a natural Indonesian voice, clear and expressive: ${text}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice || "Kore",
            },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return NextResponse.json({ error: "Audio gagal dibuat." }, { status: 500 });
    }

    const pcmBuffer = Buffer.from(base64Audio, "base64");
    const wavBuffer = pcmToWav(pcmBuffer);

    return new Response(wavBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": 'attachment; filename="gemini-tts.wav"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Terjadi error saat membuat audio." }, { status: 500 });
  }
}