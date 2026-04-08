import { formatSecondsToTimestamp } from "@/lib/mixes/format-duration";

/**
 * Browser-only: loads metadata from a remote audio URL.
 * Use from client components (upload / repair actions), not during SSR.
 */
export function getAudioDurationFromUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }

    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.crossOrigin = "anonymous";

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      audio.src = "";
      audio.load();
    };

    const handleLoadedMetadata = () => {
      const formatted = formatSecondsToTimestamp(audio.duration);
      cleanup();
      resolve(formatted || null);
    };

    const handleError = () => {
      cleanup();
      resolve(null);
    };

    const startFallbackTimer = () => {
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 10000);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);
    startFallbackTimer();
    audio.src = url;
  });
}
