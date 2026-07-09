"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export interface InsightAudioProps {
  /** Presigned URL to the insight's spoken-summary MP3. */
  audioUrl?: string | null;
}

/**
 * Compact play/pause control for an insight's text-to-speech summary.
 * Renders nothing when no audio is available (e.g. older insights created
 * before TTS was enabled, or when synthesis failed on the backend).
 */
export function InsightAudio({ audioUrl }: InsightAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset state if the URL changes (e.g. after a refresh regenerates the presign).
  useEffect(() => {
    setIsPlaying(false);
    setHasError(false);
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setHasError(true));
    }
  }, [isPlaying]);

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={togglePlay}
        className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5"
        aria-label={isPlaying ? "Pause insight audio" : "Listen to insight"}
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M5.75 4.5a.75.75 0 00-.75.75v9.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-9.5a.75.75 0 00-.75-.75h-1.5zm7 0a.75.75 0 00-.75.75v9.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75v-9.5a.75.75 0 00-.75-.75h-1.5z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.89a1.5 1.5 0 000-2.54L6.3 2.84z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span className="text-xs font-medium">
          {isPlaying ? "Pause" : "Listen"}
        </span>
      </button>

      {hasError && (
        <span className="text-xs text-danger" role="alert">
          Audio unavailable
        </span>
      )}

      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
      >
        <track kind="captions" />
      </audio>
    </div>
  );
}
