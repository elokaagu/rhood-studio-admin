import { NextResponse } from "next/server";
import { refineTextWithAi } from "@/lib/ai/refine-text";

interface RefineRequest {
  text: string;
  maxLength: number;
  context?: {
    title?: string;
    location?: string;
    compensation?: string;
    genres?: string[];
    dateType?: string;
    date?: string;
    endDate?: string;
    time?: string;
    endTime?: string;
    requirements?: string;
    website?: string;
  };
}

function contextBlock(context: RefineRequest["context"]): string {
  if (!context) return "";
  const lines = [
    context.title && `Title: ${context.title}`,
    context.location && `Location: ${context.location}`,
    context.compensation && `Compensation: ${context.compensation}`,
    context.genres?.length ? `Genres: ${context.genres.join(", ")}` : "",
    context.dateType === "range" || context.endDate
      ? "Campaign type: Multi Date Campaign"
      : context.dateType
        ? "Campaign type: Single Date Event"
        : "",
    context.date && `Start date: ${context.date}`,
    context.endDate && `End date: ${context.endDate}`,
    context.time && `Start time: ${context.time}`,
    context.endTime && `Finish time: ${context.endTime}`,
    context.requirements && `Requirements: ${context.requirements}`,
    context.website && `Website: ${context.website}`,
  ].filter(Boolean);
  return lines.length ? `\n\nListing details already entered:\n${lines.join("\n")}` : "";
}

const NEXT_BRIEF_HEADING =
  /(?:^|\n)\s*(the opportunity|who it's for|what you'll do|vibe\s*&\s*sound)\b/i;

function stripPracticalDetailsSection(text: string): string {
  const heading = /(?:^|\n)\s*practical details\b[^\n]*/i;
  const match = heading.exec(text);
  if (!match || match.index === undefined) return text.trim();

  const after = text.slice(match.index + match[0].length);
  const next = NEXT_BRIEF_HEADING.exec(after);
  const end =
    next && next.index !== undefined
      ? match.index + match[0].length + next.index
      : text.length;
  return `${text.slice(0, match.index)}${text.slice(end)}`
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: Request) {
  try {
    const body: RefineRequest = await request.json();
    const { text, maxLength, context } = body;

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

    const system = `You write standardised DJ opportunity briefs for R/HOOD Studio.

Turn the brand's rough notes into a fuller, more useful brief that DJs can actually apply from. Expand the idea with context — what the event is, who it is for, what the DJ will do, and the vibe/sound.

Rules:
- Expand and add helpful context. Do not just tidy grammar or shorten the text.
- Keep every fact the brand wrote. Do not invent fees, dates, venues, or brand names that are not in the notes or listing details.
- If listing details are provided, weave them in naturally instead of repeating them as a bullet dump.
- Use this structure, skipping a heading only when there is nothing to say:
  The opportunity
  Who it's for
  What you'll do
  Vibe & sound
- Do not include a Practical details section, logistics, load-in, door times, or a recap of dates, location, or pay. Those live elsewhere on the listing.
- Professional, direct, and inviting. No hype, no hashtags, no markdown headings with #.
- Stay within the character limit. Return only the brief.`;
    const prompt = `Write a standardised DJ brief of at most ${maxLength} characters from these notes:\n\n${text}${contextBlock(context)}`;

    const refinedText = stripPracticalDetailsSection(
      await refineTextWithAi({
        system,
        prompt,
        maxTokens: Math.max(700, maxLength),
      })
    );

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
