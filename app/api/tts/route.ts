import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16) {
  const byteRate = sampleRate * channels * (bitDepth / 8);
  const blockAlign = channels * (bitDepth / 8);
  const wavHeader = Buffer.alloc(44);

  wavHeader.write("RIFF", 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write("WAVE", 8);
  wavHeader.write("fmt ", 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(channels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitDepth, 34);
  wavHeader.write("data", 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([wavHeader, pcmBuffer]);
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