import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditEntryModal } from "./EditEntryModal";
import { ApiClientError } from "@/lib/api/client";

// Mock the API client
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({ data: {}, status: 201, ok: true }),
    put: vi.fn().mockResolvedValue({ data: {}, status: 200, ok: true }),
  },
  ApiClientError: class ApiClientError extends Error {
    code: string;
    status: number;
    field?: string;
    constructor(message: string, code: string, status: number, field?: string) {
      super(message);
      this.name = "ApiClientError";
      this.code = code;
      this.status = status;
      this.field = field;
    }
  },
}));

describe("EditEntryModal", () => {
  const mockSymptomEntry = {
    entryId: "entry-123",
    entryType: "symptom" as const,
    version: 1,
    symptomName: "Headache",
    severity: 7,
    notes: "Pain in temples",
  };

  const mockMedicationEntry = {
    entryId: "entry-456",
    entryType: "medication" as const,
    version: 2,
    medicationName: "Ibuprofen",
    dosageAmount: 400,
    scheduleType: "as-needed" as const,
  };

  const mockFoodEntry = {
    entryId: "entry-789",
    entryType: "food" as const,
    version: 1,
    mealType: "lunch",
    items: [{ description: "Chicken salad", tags: ["protein"] }],
  };

  const mockSleepEntry = {
    entryId: "entry-101",
    entryType: "sleep" as const,
    version: 1,
    segments: [
      { startTime: "2024-01-01T22:00", endTime: "2024-01-02T06:00", durationMinutes: 480 },
    ],
    qualityRating: 8,
    notes: "Good sleep",
  };

  const defaultProps = {
    entry: mockSymptomEntry,
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <EditEntryModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the modal with correct title for symptom entry", () => {
    render(<EditEntryModal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Edit Symptom Entry")).toBeInTheDocument();
  });

  it("renders correct form for symptom entry type", () => {
    render(<EditEntryModal {...defaultProps} entry={mockSymptomEntry} />);

    expect(screen.getByLabelText(/symptom name/i)).toBeInTheDocument();
  });

  it("renders correct form for medication entry type", () => {
    render(<EditEntryModal {...defaultProps} entry={mockMedicationEntry} />);

    expect(screen.getByText("Edit Medication Entry")).toBeInTheDocument();
  });

  it("renders correct form for food entry type", () => {
    render(<EditEntryModal {...defaultProps} entry={mockFoodEntry} />);

    expect(screen.getByText("Edit Food Entry")).toBeInTheDocument();
  });

  it("renders correct form for sleep entry type", () => {
    render(<EditEntryModal {...defaultProps} entry={mockSleepEntry} />);

    expect(screen.getByText("Edit Sleep Entry")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<EditEntryModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /close edit modal/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays conflict error message for 409 status", async () => {
    const { apiClient } = await import("@/lib/api/client");
    const { ApiClientError: MockApiClientError } = await import("@/lib/api/client");
    const mockPut = vi.mocked(apiClient.put);
    mockPut.mockRejectedValueOnce(
      new MockApiClientError("Conflict", "CONFLICT", 409)
    );

    render(<EditEntryModal {...defaultProps} entry={mockSymptomEntry} />);

    // Fill in required field and submit
    const nameInput = screen.getByLabelText(/symptom name/i);
    fireEvent.change(nameInput, { target: { value: "Updated Headache" } });

    const submitBtn = screen.getByRole("button", { name: /update entry/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          "This entry was modified elsewhere. Please close and refresh to see the latest version."
        )
      ).toBeInTheDocument();
    });

    // Check refresh button is shown
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("displays not found error message for 404 status", async () => {
    const { apiClient } = await import("@/lib/api/client");
    const { ApiClientError: MockApiClientError } = await import("@/lib/api/client");
    const mockPut = vi.mocked(apiClient.put);
    mockPut.mockRejectedValueOnce(
      new MockApiClientError("Not Found", "NOT_FOUND", 404)
    );

    render(<EditEntryModal {...defaultProps} entry={mockSymptomEntry} />);

    const nameInput = screen.getByLabelText(/symptom name/i);
    fireEvent.change(nameInput, { target: { value: "Updated Headache" } });

    const submitBtn = screen.getByRole("button", { name: /update entry/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Entry not found. It may have been deleted.")
      ).toBeInTheDocument();
    });
  });
});
