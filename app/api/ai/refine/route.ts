import { NextResponse } from "next/server";
import { refineTextWithAi } from "@/lib/ai/refine-text";

interface RefineRequest {
  text: string;
  maxLength: number;
}

export async function POST(request: Request) {
  try {
    const body: RefineRequest = await request.json();
    const { text, maxLength } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string." },
        { status: 400 }
      );
    }

    if (!maxLength || typeof maxLength !== "number" || maxLength <= 0) {
      return NextResponse.json(
        { error: "maxLength is required and must be a positive number." },
        { status: 400 }
      );
    }

    const system = `You are a helpful assistant that refines text to be clearer and more concise while preserving the original meaning and key information. Your goal is to improve clarity, grammar, and flow while staying within the character limit. Do not rewrite completely - only refine what's already there. Return only the refined text.`;
    const prompt = `Please refine the following text to be clearer and more concise while preserving all key information. The refined text must be no more than ${maxLength} characters. Keep the same tone and style. Only refine, don't rewrite completely:\n\n${text}`;

    const refinedText = await refineTextWithAi({
      system,
      prompt,
      maxTokens: Math.max(80, Math.floor(maxLength / 2)),
    });

    const finalText =
      refinedText.length > maxLength
        ? refinedText.substring(0, maxLength).trim()
        : refinedText;

    return NextResponse.json({ refinedText: finalText });
  } catch (error) {
    console.error("Error refining text:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to refine text",
      },
      { status: 500 }
    );
  }
}
