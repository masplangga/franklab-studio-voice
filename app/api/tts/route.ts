import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    apiKeyExists: !!process.env.GEMINI_API_KEY,
    apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
    apiKeyValue: JSON.stringify(process.env.GEMINI_API_KEY),
    nodeEnv: process.env.NODE_ENV,
  });
}