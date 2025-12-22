import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface RefineBriefRequest {
  brief: string;
  template?: string;
}

const RHOOD_BRIEF_TEMPLATE = `You are refining a brief for R/HOOD, a music community platform connecting brands with DJs.

Your task is to refine the brief using the R/HOOD standard template format, ensuring:
1. Professional, clear, and compelling tone
2. Consistent brand voice that matches R/HOOD's style
3. All key information preserved and enhanced
4. Proper structure with clear sections
5. Engaging language that excites DJs
6. No vague or lazy descriptions

The brief should follow this structure:
- **The idea** - Core concept (compelling and clear)
- **Format overview** - Collaborative sessions, locations, content capture
- **Episode flow** - How episodes work
- **Why it works?** - Accessibility, collaboration, content-first, entertainment value
- **Pilot Episodes** - Details about episodes
- **Deliverables** - What will be delivered
- **Investment** - Budget/investment details

Refine the brief to be professional, clear, and compelling while maintaining the R/HOOD brand voice.`;

export async function POST(request: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    const body: RefineBriefRequest = await request.json();
    const { brief, template = "rhood-standard" } = body;

    if (!brief || typeof brief !== "string") {
      return NextResponse.json(
        { error: "Brief is required and must be a string." },
        { status: 400 }
      );
    }

    if (!brief.trim()) {
      return NextResponse.json(
        { error: "Brief cannot be empty." },
        { status: 400 }
      );
    }

    // Call OpenAI API to refine the brief
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
            content: RHOOD_BRIEF_TEMPLATE,
          },
          {
            role: "user",
            content: `Please refine the following brief using the R/HOOD template. Ensure it's professional, clear, compelling, and maintains consistent brand voice. Preserve all key information but enhance clarity and tone:\n\n${brief}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.4, // Slightly higher for more creative refinement
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        {
          error: "Failed to refine brief",
          details: errorData.error?.message || "Unknown error",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const refinedBrief = data.choices?.[0]?.message?.content?.trim() || brief;

    return NextResponse.json({ refinedBrief });
  } catch (error) {
    console.error("Error refining brief:", error);
    return NextResponse.json(
      {
        error: "Unexpected error while refining brief",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
