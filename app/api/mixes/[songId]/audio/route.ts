import { fetchPublicMix } from "@/lib/mixes/fetch-public-mix";
import { resolveMixStorageUrl } from "@/lib/mixes/share-url";

type AudioRouteProps = {
  params: Promise<{ songId: string }>;
};

export async function GET(request: Request, { params }: AudioRouteProps) {
  const { songId } = await params;
  const mix = await fetchPublicMix(songId);
  const storageUrl = mix ? resolveMixStorageUrl(mix.file_url) : null;

  if (!storageUrl) {
    return new Response("Mix not found", { status: 404 });
  }

  const range = request.headers.get("range");
  const upstream = await fetch(storageUrl, {
    headers: range ? { Range: range } : undefined,
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response("Audio unavailable", { status: upstream.status });
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    upstream.headers.get("content-type") || "audio/mpeg"
  );
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  const contentRange = upstream.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
