import Image from "next/image";
import { formatDurationDisplay } from "@/lib/mixes/format-duration";
import { getMixAudioPath } from "@/lib/mixes/share-url";

type MixPublicPlayerProps = {
  mixId: string;
  title: string;
  artist: string;
  genre: string;
  duration: string | null;
  imageUrl: string | null;
};

export function MixPublicPlayer({
  mixId,
  title,
  artist,
  genre,
  duration,
  imageUrl,
}: MixPublicPlayerProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 py-12">
      <Image
        src="/RHOOD_Lettering_Logo.png"
        alt="R/HOOD"
        width={160}
        height={48}
        className="h-10 w-auto mb-10"
        priority
      />

      <div className="w-full max-w-md flex flex-col items-center">
        <div className="relative h-56 w-56 rounded-2xl overflow-hidden bg-card border border-border mb-8">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="224px"
              unoptimized
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Image
                src="/rhood_logo.webp"
                alt=""
                width={72}
                height={72}
                className="h-[72px] w-[72px] opacity-80"
              />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-semibold text-center leading-tight">
          {title}
        </h1>
        <p className="mt-2 text-muted-foreground text-center">{artist}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-brand-green">
          {genre}
          {duration ? ` · ${formatDurationDisplay(duration)}` : ""}
        </p>

        <audio
          className="mt-8 w-full"
          controls
          autoPlay
          preload="metadata"
          src={getMixAudioPath(mixId)}
        >
          Your browser does not support audio playback.
        </audio>
      </div>
    </div>
  );
}
