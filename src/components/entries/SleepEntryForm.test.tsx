import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SleepEntryForm } from "./SleepEntryForm";

// Mock the API client
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({ data: {}, status: 201, ok: true }),
  },
}));

describe("SleepEntryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders initial segment with start/end time fields", () => {
    render(<SleepEntryForm />);

    expect(screen.getByLabelText("Start Time")).toBeInTheDocument();
    expect(screen.getByLabelText("End Time")).toBeInTheDocument();
    expect(screen.getByText("Segment 1")).toBeInTheDocument();
    expect(screen.getByText("Sleep Segments (1/10)")).toBeInTheDocument();
  });

  it("auto-calculates duration when times are set", async () => {
    render(<SleepEntryForm />);

    const startInput = screen.getByLabelText("Start Time");
    const endInput = screen.getByLabelText("End Time");

    fireEvent.change(startInput, { target: { value: "2024-01-15T22:00" } });
    fireEvent.change(endInput, { target: { value: "2024-01-16T06:00" } });

    // Duration should be 8 hours (480 minutes)
    await waitFor(() => {
      expect(screen.getByTestId("segment-duration-0")).toHaveTextContent("8h");
    });

    expect(screen.getByTestId("total-duration")).toHaveTextContent("8h");
  });

  it("shows validation error when endTime <= startTime", async () => {
    render(<SleepEntryForm />);

    const startInput = screen.getByLabelText("Start Time");
    const endInput = screen.getByLabelText("End Time");

    fireEvent.change(startInput, { target: { value: "2024-01-16T08:00" } });
    fireEvent.change(endInput, { target: { value: "2024-01-16T06:00" } });

    // Advance timers past the 300ms debounce
    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("End time must be after start time")).toBeInTheDocument();
    });
  });

  it("shows validation error for overlapping segments", async () => {
    render(<SleepEntryForm />);

    // Add a second segment
    fireEvent.click(screen.getByText("Add Segment"));

    // Set segment 1: 22:00 - 02:00
    const startInputs = screen.getAllByLabelText("Start Time");
    const endInputs = screen.getAllByLabelText("End Time");

    fireEvent.change(startInputs[0], { target: { value: "2024-01-15T22:00" } });
    fireEvent.change(endInputs[0], { target: { value: "2024-01-16T02:00" } });

    // Set segment 2: 01:00 - 06:00 (overlaps with segment 1)
    fireEvent.change(startInputs[1], { target: { value: "2024-01-16T01:00" } });
    fireEvent.change(endInputs[1], { target: { value: "2024-01-16T06:00" } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(screen.getByText("Segments must not overlap")).toBeInTheDocument();
    });
  });

  it("shows validation error for total duration > 24 hours", async () => {
    render(<SleepEntryForm />);

    // Add a second segment
    fireEvent.click(screen.getByText("Add Segment"));

    const startInputs = screen.getAllByLabelText("Start Time");
    const endInputs = screen.getAllByLabelText("End Time");

    // Segment 1: 13 hours
    fireEvent.change(startInputs[0], { target: { value: "2024-01-15T10:00" } });
    fireEvent.change(endInputs[0], { target: { value: "2024-01-15T23:00" } });

    // Segment 2: 12 hours (total = 25 hours > 24)
    fireEvent.change(startInputs[1], { target: { value: "2024-01-16T00:00" } });
    fireEvent.change(endInputs[1], { target: { value: "2024-01-16T12:00" } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Total sleep duration cannot exceed 24 hours")
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for quality rating outside 1-10", async () => {
    render(<SleepEntryForm />);

    const numberInput = screen.getByLabelText("Quality rating number input");
    fireEvent.change(numberInput, { target: { value: "0" } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Quality rating must be an integer between 1 and 10")
      ).toBeInTheDocument();
    });
  });

  it("can add and remove segments (max 10)", () => {
    render(<SleepEntryForm />);

    // Should start with 1 segment
    expect(screen.getByText("Sleep Segments (1/10)")).toBeInTheDocument();

    // Add segments up to 10
    for (let i = 0; i < 9; i++) {
      fireEvent.click(screen.getByText("Add Segment"));
    }

    expect(screen.getByText("Sleep Segments (10/10)")).toBeInTheDocument();

    // Add button should not be present anymore
    expect(screen.queryByText("Add Segment")).not.toBeInTheDocument();

    // Remove a segment
    const removeButtons = screen.getAllByText("Remove");
    fireEvent.click(removeButtons[0]);

    expect(screen.getByText("Sleep Segments (9/10)")).toBeInTheDocument();
    expect(screen.getByText("Add Segment")).toBeInTheDocument();
  });

  it("accepts valid input without errors", async () => {
    const { apiClient } = await import("@/lib/api/client");

    render(<SleepEntryForm />);

    const startInput = screen.getByLabelText("Start Time");
    const endInput = screen.getByLabelText("End Time");

    fireEvent.change(startInput, { target: { value: "2024-01-15T22:00" } });
    fireEvent.change(endInput, { target: { value: "2024-01-16T06:00" } });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should not have validation errors
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    // Submit the form
    fireEvent.click(screen.getByText("Save Sleep Entry"));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/entries/sleep", {
        entryType: "sleep",
        segments: [
          {
            // Sent as UTC ISO so the backend doesn't misread local time as UTC.
            // Computed from the input (not hardcoded) to stay timezone-agnostic.
            startTime: new Date("2024-01-15T22:00").toISOString(),
            endTime: new Date("2024-01-16T06:00").toISOString(),
            durationMinutes: 480,
          },
        ],
        totalDuration: 480,
        qualityRating: 5,
        notes: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Sleep entry saved successfully!")).toBeInTheDocument();
    });
  });
});
