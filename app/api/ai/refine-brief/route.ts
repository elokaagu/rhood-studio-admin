import { NextResponse } from "next/server";
import { refineTextWithAi } from "@/lib/ai/refine-text";

interface RefineBriefRequest {
  brief: string;
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

Refine the brief to be professional, clear, and compelling while maintaining the R/HOOD brand voice. Return only the refined brief.`;

export async function POST(request: Request) {
  try {
    const body: RefineBriefRequest = await request.json();
    const { brief } = body;

    if (!brief || typeof brief !== "string" || !brief.trim()) {
      return NextResponse.json(
        { error: "Brief is required and must be a string." },
        { status: 400 }
      );
    }

    const refinedBrief = await refineTextWithAi({
      system: RHOOD_BRIEF_TEMPLATE,
      prompt: `Please refine the following brief using the R/HOOD template. Ensure it's professional, clear, compelling, and maintains consistent brand voice. Preserve all key information but enhance clarity and tone:\n\n${brief}`,
      maxTokens: 2000,
    });

    return NextResponse.json({ refinedBrief });
  } catch (error) {
    console.error("Error refining brief:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to refine brief",
      },
      { status: 500 }
    );
  }
}
