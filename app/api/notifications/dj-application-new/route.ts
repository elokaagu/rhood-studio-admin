import { NextResponse } from "next/server";
import {
  notifyAdminsOfNewDjApplication,
  type NewDjApplicationPayload,
} from "@/lib/email/notify-admins-new-dj-application";

export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.APPLICATION_NOTIFY_SECRET?.trim();
    if (expectedSecret) {
      const provided = request.headers.get("x-rhood-webhook-secret") ?? "";
      if (provided !== expectedSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await request.json()) as NewDjApplicationPayload;
    const result = await notifyAdminsOfNewDjApplication(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, emailed: result.emailed });
  } catch (error) {
    console.error("[dj-application-new]", error);
    return NextResponse.json(
      { error: "Failed to notify admins of the DJ application." },
      { status: 500 }
    );
  }
}
