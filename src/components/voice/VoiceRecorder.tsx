"use client";

import { useCallback, useRef, useState } from "react";
import { Spinner } from "@/components/ui";
import { voiceService, VoiceDraft } from "@/lib/voice/voice-service";

interface VoiceRecorderProps {
  onDraftReady: (draft: VoiceDraft) => void;
}

type Phase = "idle" | "recording" | "uploading" | "processing" | "error";

const POLL_INTERVAL_MS = 2500;
const MAX_POLLS = 40; // ~100s

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const candidates = ["audio/webm", "audio/ogg", "audio/mp4"];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "audio/webm";
}

export function VoiceRecorder({ onDraftReady }: VoiceRecorderProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeRef = useRef<string>("audio/webm");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const pollDraft = useCallback(
    async (draftId: string) => {
      for (let i = 0; i < MAX_POLLS; i++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        const draft = await voiceService.getDraft(draftId);
        if (draft.status === "READY") {
          setPhase("idle");
          onDraftReady(draft);
          return;
        }
        if (draft.status === "FAILED") {
          setPhase("error");
          setError(draft.failureReason || "Could not process your recording.");
          return;
        }
      }
      setPhase("error");
      setError("Processing timed out. Please try again.");
    },
    [onDraftReady]
  );

  const handleStop = useCallback(async () => {
    setPhase("uploading");
    setError(null);
    try {
      const contentType = mimeRef.current;
      const blob = new Blob(chunksRef.current, { type: contentType });
      chunksRef.current = [];

      const ticket = await voiceService.requestUpload(contentType);
      await voiceService.uploadAudio(ticket.uploadUrl, contentType, blob);

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      await voiceService.startProcessing(ticket.draftId, timezone);

      setPhase("processing");
      await pollDraft(ticket.draftId);
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      stopStream();
    }
  }, [pollDraft, stopStream]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      mimeRef.current = mime;

      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = handleStop;
      mediaRecorderRef.current = recorder;
      recorder.start();
      setPhase("recording");
    } catch {
      setPhase("error");
      setError("Microphone access was denied.");
    }
  }, [handleStop]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const busy = phase === "uploading" || phase === "processing";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-fg">Log by voice</p>
          <p className="text-xs text-muted">
            Speak naturally, e.g. &quot;Headache severity 7 at 2pm, took 500mg paracetamol.&quot;
          </p>
        </div>

        {phase === "recording" ? (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white"
          >
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Working..." : "Record"}
          </button>
        )}
      </div>

      {phase === "recording" && (
        <p className="mt-3 flex items-center gap-2 text-sm text-danger" role="status">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" aria-hidden />
          Recording...
        </p>
      )}

      {busy && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted" role="status">
          <Spinner className="h-4 w-4" />
          {phase === "uploading" ? "Uploading audio..." : "Transcribing and analyzing..."}
        </div>
      )}

      {phase === "error" && error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
