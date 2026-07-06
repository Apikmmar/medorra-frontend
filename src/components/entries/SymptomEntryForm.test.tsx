import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { SymptomEntryForm } from "./SymptomEntryForm";

// Mock the API client
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({ data: {}, status: 201, ok: true }),
  },
}));

describe("SymptomEntryForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders all fields", () => {
    render(<SymptomEntryForm />);

    expect(screen.getByLabelText(/symptom name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/severity slider/i)).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: /severity/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/timestamp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save symptom entry/i })).toBeInTheDocument();
  });

  it("shows validation error for empty symptom name on blur", async () => {
    render(<SymptomEntryForm />);

    const nameInput = screen.getByLabelText(/symptom name/i);

    await act(async () => {
      fireEvent.focus(nameInput);
      fireEvent.blur(nameInput);
    });

    expect(screen.getByText("Symptom name is required")).toBeInTheDocument();
  });

  it("shows validation error for symptom name exceeding 100 chars on blur", async () => {
    render(<SymptomEntryForm />);

    const nameInput = screen.getByLabelText(/symptom name/i);
    const longName = "a".repeat(101);

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: longName } });
      fireEvent.blur(nameInput);
    });

    expect(
      screen.getByText("Symptom name must be 100 characters or less")
    ).toBeInTheDocument();
  });

  it("shows validation error for severity outside 1-10 range", async () => {
    render(<SymptomEntryForm />);

    const severityInput = screen.getByRole("spinbutton");

    await act(async () => {
      fireEvent.change(severityInput, { target: { value: "11" } });
      fireEvent.blur(severityInput);
    });

    expect(
      screen.getByText("Severity must be an integer between 1 and 10")
    ).toBeInTheDocument();
  });

  it("shows validation error for severity of 0", async () => {
    render(<SymptomEntryForm />);

    const severityInput = screen.getByRole("spinbutton");

    await act(async () => {
      fireEvent.change(severityInput, { target: { value: "0" } });
      fireEvent.blur(severityInput);
    });

    expect(
      screen.getByText("Severity must be an integer between 1 and 10")
    ).toBeInTheDocument();
  });

  it("shows validation error for notes exceeding 2000 chars", async () => {
    render(<SymptomEntryForm />);

    const notesInput = screen.getByLabelText(/notes/i);
    const longNotes = "a".repeat(2001);

    await act(async () => {
      fireEvent.change(notesInput, { target: { value: longNotes } });
      fireEvent.blur(notesInput);
    });

    expect(
      screen.getByText("Notes must be 2000 characters or less")
    ).toBeInTheDocument();
  });

  it("accepts valid input without errors", async () => {
    render(<SymptomEntryForm />);

    const nameInput = screen.getByLabelText(/symptom name/i);
    const severityInput = screen.getByRole("spinbutton");
    const notesInput = screen.getByLabelText(/notes/i);

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Headache" } });
      fireEvent.blur(nameInput);
      fireEvent.change(severityInput, { target: { value: "7" } });
      fireEvent.blur(severityInput);
      fireEvent.change(notesInput, { target: { value: "Mild pain in temples" } });
      fireEvent.blur(notesInput);
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows inline validation within 1 second of field interaction", async () => {
    render(<SymptomEntryForm />);

    const nameInput = screen.getByLabelText(/symptom name/i);

    // Type whitespace only (invalid)
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "   " } });
    });

    // No error yet
    expect(screen.queryByText("Symptom name is required")).not.toBeInTheDocument();

    // Advance timers by 800ms (the debounce time)
    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    // Error should now appear
    expect(screen.getByText("Symptom name is required")).toBeInTheDocument();
  });

  it("supports custom symptom types via free text input", async () => {
    render(<SymptomEntryForm />);

    const nameInput = screen.getByLabelText(/symptom name/i);

    await act(async () => {
      fireEvent.change(nameInput, {
        target: { value: "Unusual tingling in left hand" },
      });
      fireEvent.blur(nameInput);
    });

    // No validation error for any free-form symptom name
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(nameInput).toHaveValue("Unusual tingling in left hand");
  });

  it("calls apiClient.post on valid submit", async () => {
    vi.useRealTimers();
    const { apiClient } = await import("@/lib/api/client");
    const mockPost = vi.mocked(apiClient.post);
    mockPost.mockResolvedValue({ data: {}, status: 201, ok: true });

    const onSuccess = vi.fn();
    render(<SymptomEntryForm onSuccess={onSuccess} />);

    const nameInput = screen.getByLabelText(/symptom name/i);
    const severityInput = screen.getByRole("spinbutton");

    fireEvent.change(nameInput, { target: { value: "Migraine" } });
    fireEvent.change(severityInput, { target: { value: "8" } });

    const submitBtn = screen.getByRole("button", { name: /save symptom entry/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/entries/symptom", {
        entryType: "symptom",
        symptomName: "Migraine",
        severity: 8,
      });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("does not submit form when validation fails", async () => {
    vi.useRealTimers();
    const { apiClient } = await import("@/lib/api/client");
    const mockPost = vi.mocked(apiClient.post);
    mockPost.mockClear();

    render(<SymptomEntryForm />);

    // Submit without filling required fields
    const submitBtn = screen.getByRole("button", { name: /save symptom entry/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Symptom name is required")).toBeInTheDocument();
    });

    expect(mockPost).not.toHaveBeenCalled();
  });

  it("displays submit error on API failure", async () => {
    vi.useRealTimers();
    const { apiClient } = await import("@/lib/api/client");
    const mockPost = vi.mocked(apiClient.post);
    mockPost.mockRejectedValueOnce(new Error("Network error"));

    const onError = vi.fn();
    render(<SymptomEntryForm onError={onError} />);

    const nameInput = screen.getByLabelText(/symptom name/i);
    fireEvent.change(nameInput, { target: { value: "Back pain" } });

    const submitBtn = screen.getByRole("button", { name: /save symptom entry/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    expect(onError).toHaveBeenCalled();
  });
});
