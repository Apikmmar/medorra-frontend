import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InsightsPanel, InsightsResponse } from "./InsightsPanel";

const mockGet = vi.fn();

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

const mockInsightsResponse: InsightsResponse = {
  insights: [
    {
      userId: "user-1",
      insightId: "insight-1",
      trigger: { entryType: "food", identifier: "Dairy" },
      correlatedSymptom: "Headache",
      averageDelay: "2 days",
      confidenceScore: 0.85,
      summary:
        "You tend to experience headaches about 2 days after consuming dairy products.",
      supportingEntryIds: ["entry-1", "entry-2", "entry-3"],
      hasDeletedEntries: false,
      status: "active",
      createdAt: "2024-03-10T00:00:00Z",
      updatedAt: "2024-03-10T00:00:00Z",
    },
    {
      userId: "user-1",
      insightId: "insight-2",
      trigger: { entryType: "medication", identifier: "Ibuprofen" },
      correlatedSymptom: "Stomach pain",
      averageDelay: "6 hours",
      confidenceScore: 0.6,
      summary:
        "Stomach pain often follows within 6 hours of taking ibuprofen.",
      supportingEntryIds: ["entry-4", "entry-5"],
      hasDeletedEntries: true,
      status: "active",
      createdAt: "2024-03-09T00:00:00Z",
      updatedAt: "2024-03-09T00:00:00Z",
    },
  ],
  thresholdMet: true,
  daysRemaining: 0,
  totalDistinctDays: 20,
};

const thresholdNotMetResponse: InsightsResponse = {
  insights: [],
  thresholdMet: false,
  daysRemaining: 5,
  totalDistinctDays: 9,
};

const emptyInsightsResponse: InsightsResponse = {
  insights: [],
  thresholdMet: true,
  daysRemaining: 0,
  totalDistinctDays: 18,
};

describe("InsightsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<InsightsPanel />);

    expect(
      screen.getByRole("status", { name: /loading insights/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Loading insights...")).toBeInTheDocument();
  });

  it("shows threshold not met state with days remaining message", async () => {
    mockGet.mockResolvedValue({
      data: thresholdNotMetResponse,
      status: 200,
      ok: true,
    });
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "5 more days of logging needed before pattern analysis can begin."
        )
      ).toBeInTheDocument();
    });
  });

  it("shows no patterns detected message when threshold met but no insights", async () => {
    mockGet.mockResolvedValue({
      data: emptyInsightsResponse,
      status: 200,
      ok: true,
    });
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("No patterns detected yet.")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Keep logging entries and we'll analyze your data for correlations."
      )
    ).toBeInTheDocument();
  });

  it("renders insights with confidence score, summary, and supporting entry count", async () => {
    mockGet.mockResolvedValue({
      data: mockInsightsResponse,
      status: 200,
      ok: true,
    });
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Confidence: 0.85")).toBeInTheDocument();
    });

    // Confidence scores
    expect(screen.getByText("Confidence: 0.60")).toBeInTheDocument();

    // Summaries
    expect(
      screen.getByText(
        "You tend to experience headaches about 2 days after consuming dairy products."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Stomach pain often follows within 6 hours of taking ibuprofen."
      )
    ).toBeInTheDocument();

    // Supporting entries
    expect(screen.getByText("3 supporting entries")).toBeInTheDocument();
    expect(screen.getByText("2 supporting entries")).toBeInTheDocument();
  });

  it("displays trigger info and correlated symptom", async () => {
    mockGet.mockResolvedValue({
      data: mockInsightsResponse,
      status: 200,
      ok: true,
    });
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Trigger: Dairy (food)")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Trigger: Ibuprofen (medication)")
    ).toBeInTheDocument();
    expect(screen.getByText("Symptom: Headache")).toBeInTheDocument();
    expect(screen.getByText("Symptom: Stomach pain")).toBeInTheDocument();
    expect(screen.getByText("Avg delay: 2 days")).toBeInTheDocument();
    expect(screen.getByText("Avg delay: 6 hours")).toBeInTheDocument();
  });

  it("shows deleted entries warning flag when hasDeletedEntries is true", async () => {
    mockGet.mockResolvedValue({
      data: mockInsightsResponse,
      status: 200,
      ok: true,
    });
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Some supporting entries have been deleted")
      ).toBeInTheDocument();
    });
  });

  it("always shows the disclaimer", async () => {
    mockGet.mockResolvedValue({
      data: mockInsightsResponse,
      status: 200,
      ok: true,
    });
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(
        screen.getByText(/Insights are observational patterns/)
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/not medical diagnoses/)
    ).toBeInTheDocument();
  });

  it("shows disclaimer even when threshold not met", async () => {
    mockGet.mockResolvedValue({
      data: thresholdNotMetResponse,
      status: 200,
      ok: true,
    });
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(
        screen.getByRole("note", { name: /insights disclaimer/i })
      ).toBeInTheDocument();
    });
  });

  it("shows error state with retry button on API failure", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("retries fetch when 'Try again' is clicked", async () => {
    mockGet.mockRejectedValueOnce(new Error("Network error"));
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    mockGet.mockResolvedValueOnce({
      data: mockInsightsResponse,
      status: 200,
      ok: true,
    });
    fireEvent.click(screen.getByText("Try again"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "You tend to experience headaches about 2 days after consuming dairy products."
        )
      ).toBeInTheDocument();
    });
  });

  it("fetches insights from /insights endpoint on mount", async () => {
    mockGet.mockResolvedValue({
      data: mockInsightsResponse,
      status: 200,
      ok: true,
    });
    render(<InsightsPanel />);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/insights");
    });
  });
});
