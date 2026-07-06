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

    expect(
      screen.getByRole("status", { name: /loading/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Loading entries...")).toBeInTheDocument();
  });

  it("fetches the first timeline page on initial load", async () => {
    mockGet.mockResolvedValue({ data: mockEntries, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/entries/timeline?pageSize=15&page=1");
    });
  });

  it("displays entries with titles and details", async () => {
    mockGet.mockResolvedValue({ data: mockEntries, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("Headache")).toBeInTheDocument();
    });

    expect(screen.getByText("Severity 7/10")).toBeInTheDocument();
    expect(screen.getByText("Ibuprofen")).toBeInTheDocument();
    expect(screen.getByText("200mg")).toBeInTheDocument();
    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(screen.getByText("Oatmeal with berries")).toBeInTheDocument();
    expect(screen.getByText("8h 0m sleep")).toBeInTheDocument();
    expect(screen.getByText("Quality 8/10")).toBeInTheDocument();
  });

  it("shows the visible range and total count", async () => {
    mockGet.mockResolvedValue({ data: mockEntries, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText(/1.4/)).toBeInTheDocument();
      expect(screen.getByText(/of 4/)).toBeInTheDocument();
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

  it("renders a time element per entry", async () => {
    mockGet.mockResolvedValue({ data: mockEntries, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      const items = screen.getAllByRole("listitem");
      expect(items.length).toBe(4);
    });

    const timeElements = document.querySelectorAll("time");
    expect(timeElements.length).toBe(4);
    expect(timeElements[0].getAttribute("datetime")).toBe("2024-03-15T10:30:00Z");
  });

  it("shows pagination controls when there are multiple pages", async () => {
    const manyPages: EntriesResponse = {
      ...mockEntries,
      totalCount: 100,
      hasMore: true,
    };
    mockGet.mockResolvedValue({ data: manyPages, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: /pagination/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/Page/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  it("hides pagination when there is only one page", async () => {
    mockGet.mockResolvedValue({ data: mockEntries, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("Headache")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("navigation", { name: /pagination/i })
    ).not.toBeInTheDocument();
  });

  it("loads the next page when Next is clicked", async () => {
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
      totalCount: 30,
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
      totalCount: 30,
      hasMore: false,
    };

    mockGet.mockResolvedValueOnce({ data: page1, status: 200, ok: true });
    mockGet.mockResolvedValueOnce({ data: page2, status: 200, ok: true });

    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("Headache")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText("Aspirin")).toBeInTheDocument();
    });

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenLastCalledWith("/entries/timeline?pageSize=15&page=2");
  });

  it("switches to the by-type endpoint when a type filter is selected", async () => {
    mockGet.mockResolvedValue({ data: mockEntries, status: 200, ok: true });
    render(<TimelineView />);

    await waitFor(() => {
      expect(screen.getByText("Headache")).toBeInTheDocument();
    });

    // Open the filter panel
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    // Select the "symptom" type
    fireEvent.click(screen.getByRole("button", { name: /^symptom$/i }));

    await waitFor(() => {
      expect(mockGet).toHaveBeenLastCalledWith("/entries?pageSize=15&type=symptom");
    });
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
      screen.getByText(
        "Start logging symptoms, medications, food, or sleep to see them here."
      )
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
      expect(screen.getByText("Headache")).toBeInTheDocument();
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

  it("displays short sleep duration correctly", async () => {
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
      expect(screen.getByText("45m sleep")).toBeInTheDocument();
    });

    expect(screen.getByText("Quality 3/10")).toBeInTheDocument();
  });
});
