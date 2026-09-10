import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MixPublicPlayer } from "@/components/mixes/MixPublicPlayer";
import { fetchPublicMix } from "@/lib/mixes/fetch-public-mix";
import { getMixShareUrl, isMixId } from "@/lib/mixes/share-url";

type MixPageProps = {
  params: Promise<{ songId: string }>;
};

export async function generateMetadata({
  params,
}: MixPageProps): Promise<Metadata> {
  const { songId } = await params;
  const mix = await fetchPublicMix(songId);
  if (!mix) {
    return { title: "Mix not found" };
  }

  return {
    title: `${mix.title} — ${mix.artist}`,
    description: mix.genre ? `${mix.artist} · ${mix.genre}` : mix.artist,
    openGraph: {
      title: mix.title,
      description: mix.artist,
      url: getMixShareUrl(mix.id),
      type: "website",
      ...(mix.image_url ? { images: [{ url: mix.image_url }] } : {}),
    },
  };
}

export default async function MixPage({ params }: MixPageProps) {
  const { songId } = await params;
  if (!isMixId(songId)) notFound();

  const mix = await fetchPublicMix(songId);
  if (!mix) notFound();

  return (
    <MixPublicPlayer
      mixId={mix.id}
      title={mix.title}
      artist={mix.artist}
      genre={mix.genre}
      duration={mix.duration}
      imageUrl={mix.image_url}
    />
  );
}
