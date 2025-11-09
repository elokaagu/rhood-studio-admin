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
    const placeId = searchParams.get("placeId");
    const sessionToken = searchParams.get("sessionToken") ?? undefined;
    const fields =
      searchParams.get("fields") ?? "formatted_address,geometry/location";

    if (!placeId) {
      return NextResponse.json(
        { message: "Missing placeId parameter." },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_PLACES_API_KEY,
      fields,
    });

    if (sessionToken) {
      params.set("sessiontoken", sessionToken);
    }

    const googleResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
      {
        next: { revalidate: 0 },
      }
    );

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error("Google Places Details error:", errorText);
      return NextResponse.json(
        { message: "Failed to fetch place details." },
        { status: googleResponse.status }
      );
    }

    const data = await googleResponse.json();

    if (data.status !== "OK") {
      console.error("Google Places Details status:", data);
      return NextResponse.json(
        {
          message: data.error_message ?? data.status ?? "Unknown Places API error",
          status: data.status,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(data.result ?? {}, { status: 200 });
  } catch (error) {
    console.error("Unhandled place details error:", error);
    return NextResponse.json(
      { message: "Unexpected error fetching place details." },
      { status: 500 }
    );
  }
}

