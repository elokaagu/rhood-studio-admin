import { NextResponse } from "next/server";
import {
  notifyBrandOfNewApplication,
  type BrandNewApplicationPayload,
} from "@/lib/email/notify-brand-new-application";

export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.APPLICATION_NOTIFY_SECRET?.trim();
    if (expectedSecret) {
      const provided = request.headers.get("x-rhood-webhook-secret") ?? "";
      if (provided !== expectedSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await request.json()) as BrandNewApplicationPayload;
    const result = await notifyBrandOfNewApplication(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, emailed: result.emailed });
  } catch (error) {
    console.error("[brand-new-application]", error);
    return NextResponse.json(
      { error: "Failed to notify brand of the application." },
      { status: 500 }
    );
  }
}
