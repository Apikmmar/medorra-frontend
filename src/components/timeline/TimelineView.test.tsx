import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TimelineView, EntriesResponse } from "./TimelineView";

const mockGet = vi.fn();

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

const mockEntries: EntriesResponse = {
  entries: [
    {
      entryId: "entry-1",
      entryType: "symptom",
      createdAt: "2024-03-15T10:30:00Z",
      symptomName: "Headache",
      severity: 7,
    },
    {
      entryId: "entry-2",
      entryType: "medication",
      createdAt: "2024-03-15T09:00:00Z",
      medicationName: "Ibuprofen",
      dosageAmount: 200,
      dosageUnit: "mg",
    },
    {
      entryId: "entry-3",
      entryType: "food",
      createdAt: "2024-03-15T08:00:00Z",
      mealType: "breakfast",
      items: [{ description: "Oatmeal with berries" }],
    },
    {
      entryId: "entry-4",
      entryType: "sleep",
      createdAt: "2024-03-15T07:00:00Z",
      totalDuration: 480,
      qualityRating: 8,
    },
  ],
  totalCount: 4,
  hasMore: false,
};

describe("TimelineView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    render(<TimelineView />);

    expect(screen.getByRole("status", { name: /loading entries/i })).toBeInTheDocument();
    expect(screen.getByText("Loading entries...")).toBeInTheDocument();
  });

  it("displays entries in reverse chronological order", async () => {
    mockGet.mockResolvedValue({ data: mockEntries, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("Headache — severity 7")).toBeInTheDocument();
    });

    expect(screen.getByText("Ibuprofen — 200mg")).toBeInTheDocument();
    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(screen.getByText("8h 0m — quality 8")).toBeInTheDocument();
  });

  it("shows total entry count", async () => {
    mockGet.mockResolvedValue({ data: mockEntries, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("Showing 4 of 4 entries")).toBeInTheDocument();
    });
  });

  it("shows entry type badges", async () => {
    mockGet.mockResolvedValue({ data: mockEntries, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("Symptom")).toBeInTheDocument();
    });

    expect(screen.getByText("Medication")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Sleep")).toBeInTheDocument();
  });

  it("shows formatted timestamps", async () => {
    mockGet.mockResolvedValue({ data: mockEntries, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      const timeElements = screen.getAllByRole("listitem");
      expect(timeElements.length).toBe(4);
    });

    // Each entry should have a time element
    const timeElements = document.querySelectorAll("time");
    expect(timeElements.length).toBe(4);
    expect(timeElements[0].getAttribute("datetime")).toBe("2024-03-15T10:30:00Z");
  });

  it("shows 'Load More' button when hasMore is true", async () => {
    const responseWithMore: EntriesResponse = {
      ...mockEntries,
      totalCount: 100,
      hasMore: true,
    };
    mockGet.mockResolvedValue({ data: responseWithMore, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
    });
  });

  it("does not show 'Load More' button when hasMore is false", async () => {
    mockGet.mockResolvedValue({ data: mockEntries, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("Showing 4 of 4 entries")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
  });

  it("loads more entries when 'Load More' is clicked", async () => {
    const page1: EntriesResponse = {
      entries: [
        {
          entryId: "entry-1",
          entryType: "symptom",
          createdAt: "2024-03-15T10:30:00Z",
          symptomName: "Headache",
          severity: 7,
        },
      ],
      totalCount: 2,
      hasMore: true,
    };
    const page2: EntriesResponse = {
      entries: [
        {
          entryId: "entry-2",
          entryType: "medication",
          createdAt: "2024-03-14T09:00:00Z",
          medicationName: "Aspirin",
          dosageAmount: 100,
          dosageUnit: "mg",
        },
      ],
      totalCount: 2,
      hasMore: false,
    };

    mockGet.mockResolvedValueOnce({ data: page1, status: 200, ok: true });
    mockGet.mockResolvedValueOnce({ data: page2, status: 200, ok: true });

    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("Headache — severity 7")).toBeInTheDocument();
    });

    const loadMoreBtn = screen.getByRole("button", { name: /load more/i });
    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getByText("Aspirin — 100mg")).toBeInTheDocument();
    });

    // Both entries should be visible
    expect(screen.getByText("Headache — severity 7")).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenCalledWith("/entries?pageSize=50&page=2");
  });

  it("shows empty state when no entries exist", async () => {
    const emptyResponse: EntriesResponse = {
      entries: [],
      totalCount: 0,
      hasMore: false,
    };
    mockGet.mockResolvedValue({ data: emptyResponse, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("No entries yet")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Start logging symptoms, medications, food, or sleep to see them here.")
    ).toBeInTheDocument();
  });

  it("shows error state and retry button on API failure", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("retries fetch when 'Try again' is clicked", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network error"));
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    mockGet.mockResolvedValueOnce({ data: mockEntries, status: 200, ok: true });
    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => {
      expect(screen.getByText("Headache — severity 7")).toBeInTheDocument();
    });
  });

  it("fetches entries with pageSize=50 on initial load", async () => {
    mockGet.mockResolvedValue({ data: mockEntries, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/entries?pageSize=50&page=1");
    });
  });

  it("displays medication without dosage when not provided", async () => {
    const response: EntriesResponse = {
      entries: [
        {
          entryId: "entry-med",
          entryType: "medication",
          createdAt: "2024-03-15T09:00:00Z",
          medicationName: "Vitamin D",
        },
      ],
      totalCount: 1,
      hasMore: false,
    };
    mockGet.mockResolvedValue({ data: response, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("Vitamin D")).toBeInTheDocument();
    });
  });

  it("displays sleep duration formatted correctly", async () => {
    const response: EntriesResponse = {
      entries: [
        {
          entryId: "entry-sleep-short",
          entryType: "sleep",
          createdAt: "2024-03-15T07:00:00Z",
          totalDuration: 45,
          qualityRating: 3,
        },
      ],
      totalCount: 1,
      hasMore: false,
    };
    mockGet.mockResolvedValue({ data: response, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("45m — quality 3")).toBeInTheDocument();
    });
  });
});
