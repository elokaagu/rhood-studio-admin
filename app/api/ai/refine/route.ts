import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface RefineRequest {
  text: string;
  maxLength: number;
}

export async function POST(request: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

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

    // Note: We refine text even if it's within the limit to improve clarity

    // Call OpenAI API to refine the text
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that refines text to be clearer and more concise while preserving the original meaning and key information. Your goal is to improve clarity, grammar, and flow while staying within the character limit. Do not rewrite completely - only refine what's already there.`,
          },
          {
            role: "user",
            content: `Please refine the following text to be clearer and more concise while preserving all key information. The refined text must be no more than ${maxLength} characters. Keep the same tone and style. Only refine, don't rewrite completely:\n\n${text}`,
          },
        ],
        max_tokens: Math.floor(maxLength / 2), // Rough estimate: 1 token ≈ 2 characters
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        {
          error: "Failed to refine text",
          details: errorData.error?.message || "Unknown error",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const refinedText = data.choices?.[0]?.message?.content?.trim() || text;

    // Ensure the refined text doesn't exceed the limit
    const finalText =
      refinedText.length > maxLength
        ? refinedText.substring(0, maxLength).trim()
        : refinedText;

    return NextResponse.json({ refinedText: finalText });
  } catch (error) {
    console.error("Error refining text:", error);
    return NextResponse.json(
      {
        error: "Unexpected error while refining text",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

