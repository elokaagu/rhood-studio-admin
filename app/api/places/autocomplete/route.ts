import { NextResponse } from "next/server";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: Request) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { message: "Google Places API key is not configured." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const input = searchParams.get("input");
    const sessionToken = searchParams.get("sessionToken") ?? undefined;
    const components = searchParams.get("components") ?? undefined;
    const types = searchParams.get("types") ?? "geocode";

    if (!input || input.trim().length === 0) {
      return NextResponse.json({ predictions: [] }, { status: 200 });
    }

    const params = new URLSearchParams({
      input: input.trim(),
      key: GOOGLE_PLACES_API_KEY,
      types,
    });

    if (sessionToken) {
      params.set("sessiontoken", sessionToken);
    }

    if (components) {
      params.set("components", components);
    }

    const googleResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
      {
        next: { revalidate: 0 },
      }
    );

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error("Google Places Autocomplete error:", errorText);
      return NextResponse.json(
        { message: "Failed to fetch autocomplete results." },
        { status: googleResponse.status }
      );
    }

    const data = await googleResponse.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places Autocomplete status:", data);
      return NextResponse.json(
        {
          message: data.error_message ?? data.status ?? "Unknown Places API error",
          status: data.status,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        predictions: data.predictions ?? [],
        status: data.status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unhandled autocomplete error:", error);
    return NextResponse.json(
      { message: "Unexpected error performing autocomplete lookup." },
      { status: 500 }
    );
  }
}

