import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MedicationEntryForm } from "./MedicationEntryForm";

// Mock the API client
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({ data: {}, status: 201, ok: true }),
  },
}));

describe("MedicationEntryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all fields", () => {
    render(<MedicationEntryForm />);

    expect(screen.getByLabelText(/medication name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dosage amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dosage unit/i)).toBeInTheDocument();
    expect(screen.getByText(/schedule type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/as-needed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/scheduled/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/timestamp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save medication entry/i })
    ).toBeInTheDocument();
  });

  it("shows validation error for empty medication name on blur", async () => {
    render(<MedicationEntryForm />);

    const nameInput = screen.getByLabelText(/medication name/i);
    fireEvent.focus(nameInput);
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(
        screen.getByText(/medication name is required/i)
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for dosage outside valid range", async () => {
    render(<MedicationEntryForm />);

    const dosageInput = screen.getByLabelText(/dosage amount/i);

    // Test value too high
    fireEvent.change(dosageInput, { target: { value: "100000" } });
    fireEvent.blur(dosageInput);

    await waitFor(() => {
      expect(
        screen.getByText(/dosage must be between 0\.01 and 99999/i)
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for dosage below minimum", async () => {
    render(<MedicationEntryForm />);

    const dosageInput = screen.getByLabelText(/dosage amount/i);

    fireEvent.change(dosageInput, { target: { value: "0" } });
    fireEvent.blur(dosageInput);

    await waitFor(() => {
      expect(
        screen.getByText(/dosage must be between 0\.01 and 99999/i)
      ).toBeInTheDocument();
    });
  });

  it("shows validation error when schedule type not selected on submit", async () => {
    render(<MedicationEntryForm />);

    // Fill in medication name to pass that validation
    const nameInput = screen.getByLabelText(/medication name/i);
    fireEvent.change(nameInput, { target: { value: "Ibuprofen" } });

    // Submit without selecting schedule type
    const submitButton = screen.getByRole("button", {
      name: /save medication entry/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/schedule type must be selected/i)
      ).toBeInTheDocument();
    });
  });

  it("accepts valid input without errors (including without dosage)", async () => {
    const { apiClient } = await import("@/lib/api/client");

    render(<MedicationEntryForm />);

    // Fill in required fields
    const nameInput = screen.getByLabelText(/medication name/i);
    fireEvent.change(nameInput, { target: { value: "Metformin" } });

    // Select schedule type
    const scheduledRadio = screen.getByLabelText(/scheduled/i);
    fireEvent.click(scheduledRadio);

    // Submit (no dosage provided - should be valid per requirement 3.3)
    const submitButton = screen.getByRole("button", {
      name: /save medication entry/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/entries", {
        entryType: "medication",
        medicationName: "Metformin",
        scheduleType: "scheduled",
      });
    });

    // No errors should be visible
    expect(
      screen.queryByText(/medication name is required/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/dosage must be between/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/schedule type must be selected/i)
    ).not.toBeInTheDocument();
  });

  it("accepts valid input with dosage provided", async () => {
    const { apiClient } = await import("@/lib/api/client");

    render(<MedicationEntryForm />);

    // Fill in all fields
    fireEvent.change(screen.getByLabelText(/medication name/i), {
      target: { value: "Ibuprofen" },
    });
    fireEvent.change(screen.getByLabelText(/dosage amount/i), {
      target: { value: "200" },
    });
    fireEvent.change(screen.getByLabelText(/dosage unit/i), {
      target: { value: "mg" },
    });
    fireEvent.click(screen.getByLabelText(/as-needed/i));

    const submitButton = screen.getByRole("button", {
      name: /save medication entry/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/entries", {
        entryType: "medication",
        medicationName: "Ibuprofen",
        dosageAmount: 200,
        dosageUnit: "mg",
        scheduleType: "as-needed",
      });
    });
  });

  it("shows validation error for medication name exceeding 100 characters", async () => {
    render(<MedicationEntryForm />);

    const nameInput = screen.getByLabelText(/medication name/i);
    const longName = "a".repeat(101);
    fireEvent.change(nameInput, { target: { value: longName } });
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(
        screen.getByText(/medication name must be 100 characters or less/i)
      ).toBeInTheDocument();
    });
  });
});
