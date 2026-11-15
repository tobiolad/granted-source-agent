import { NextResponse } from "next/server";
import { isLiveModeConfigured } from "@/lib/gemini";

export async function GET() {
  return NextResponse.json({ liveMode: isLiveModeConfigured() });
}
