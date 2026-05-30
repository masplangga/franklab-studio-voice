import { GoogleGenAI } from "@google/genai";

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

export async function POST(req: Request) {
  try {
    const { text, voice } = await req.json();

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: text,
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

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    const audioData =
      (part as any)?.inlineData?.data ||
      (part as any)?.inline_data?.data;

    if (!audioData) {
      return Response.json(
        {
          success: false,
          error: "Audio tidak ditemukan pada response Gemini.",
        },
        { status: 500 }
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
  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}