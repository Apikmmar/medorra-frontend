import { apiClient } from "@/lib/api/client";

export type VoiceDraftStatus =
  | "UPLOADING"
  | "TRANSCRIBING"
  | "EXTRACTING"
  | "READY"
  | "CONFIRMED"
  | "FAILED";

export interface ProposedEntry {
  clientEntryId: string;
  entryType: "symptom" | "medication" | "food" | "sleep";
  data: Record<string, unknown>;
  confidence: number;
  missingFields: string[];
  warnings: string[];
}

export interface VoiceDraft {
  draftId: string;
  status: VoiceDraftStatus;
  transcript?: string;
  proposedEntries: ProposedEntry[];
  failureReason?: string;
}

interface UploadTicket {
  draftId: string;
  uploadUrl: string;
  audioKey: string;
  contentType: string;
}

export const voiceService = {
  async requestUpload(contentType: string): Promise<UploadTicket> {
    const res = await apiClient.post<UploadTicket>("/voice-entries/upload", {
      contentType,
    });
    return res.data;
  },

  async uploadAudio(uploadUrl: string, contentType: string, blob: Blob): Promise<void> {
    const resp = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    if (!resp.ok) {
      throw new Error(`Audio upload failed (${resp.status})`);
    }
  },

  async startProcessing(draftId: string, timezone: string): Promise<void> {
    await apiClient.post(`/voice-entries/${draftId}/process`, { timezone });
  },

  async getDraft(draftId: string): Promise<VoiceDraft> {
    const res = await apiClient.get<VoiceDraft>(`/voice-entries/${draftId}`);
    return res.data;
  },

  async confirmDraft(
    draftId: string,
    entries: { clientEntryId: string; entryType: string; data: Record<string, unknown> }[]
  ): Promise<{ created: string[] }> {
    const res = await apiClient.post<{ created: string[] }>(
      `/voice-entries/${draftId}/confirm`,
      { entries }
    );
    return res.data;
  },
};
