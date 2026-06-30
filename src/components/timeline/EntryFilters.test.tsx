import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntryFilters, EntryFilterState } from "./EntryFilters";

describe("EntryFilters", () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  it("renders type filter buttons for all entry types", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /symptom/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /medication/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /food/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sleep/i })).toBeInTheDocument();
  });

  it("renders date range inputs", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it("selects 'All' by default (no type filter)", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    const allButton = screen.getByRole("button", { name: /all/i });
    expect(allButton).toHaveAttribute("aria-pressed", "true");
  });

  it("emits filter with entryType when a type button is clicked", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    fireEvent.click(screen.getByRole("button", { name: /symptom/i }));

    expect(mockOnFilterChange).toHaveBeenCalledWith({ entryType: "symptom" });
  });

  it("emits filter without entryType when 'All' is clicked", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    // First select a type
    fireEvent.click(screen.getByRole("button", { name: /medication/i }));
    mockOnFilterChange.mockClear();

    // Then click All
    fireEvent.click(screen.getByRole("button", { name: /all/i }));

    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });

  it("highlights the selected type button", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    const foodButton = screen.getByRole("button", { name: /food/i });
    fireEvent.click(foodButton);

    expect(foodButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /all/i })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("emits filter with startDate when start date is set", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    const startInput = screen.getByLabelText(/start date/i);
    fireEvent.change(startInput, { target: { value: "2024-01-01" } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      startDate: "2024-01-01",
    });
  });

  it("emits filter with endDate when end date is set", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    const endInput = screen.getByLabelText(/end date/i);
    fireEvent.change(endInput, { target: { value: "2024-01-31" } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      endDate: "2024-01-31",
    });
  });

  it("emits combined filters when type and dates are set", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    // Set start date
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: "2024-01-01" },
    });
    // Set end date
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2024-01-31" },
    });
    // Select type
    fireEvent.click(screen.getByRole("button", { name: /sleep/i }));

    expect(mockOnFilterChange).toHaveBeenLastCalledWith({
      entryType: "sleep",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    });
  });

  it("shows error when start date is after end date", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    // Set end date first
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2024-01-01" },
    });
    mockOnFilterChange.mockClear();

    // Set start date after end date
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: "2024-02-01" },
    });

    expect(
      screen.getByText("Start date must not be after end date")
    ).toBeInTheDocument();
    // Should NOT emit filter change when dates are invalid
    expect(mockOnFilterChange).not.toHaveBeenCalled();
  });

  it("clears error when dates become valid", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    // Create invalid state
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: "2024-02-01" },
    });

    expect(
      screen.getByText("Start date must not be after end date")
    ).toBeInTheDocument();

    // Fix: change end date to be after start
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2024-03-01" },
    });

    expect(
      screen.queryByText("Start date must not be after end date")
    ).not.toBeInTheDocument();
  });

  it("shows clear dates button when dates are set", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    // No clear button initially
    expect(screen.queryByRole("button", { name: /clear dates/i })).not.toBeInTheDocument();

    // Set a date
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: "2024-01-01" },
    });

    expect(screen.getByRole("button", { name: /clear dates/i })).toBeInTheDocument();
  });

  it("clears dates and emits updated filter when clear dates is clicked", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    // Set dates and type
    fireEvent.click(screen.getByRole("button", { name: /symptom/i }));
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2024-01-31" },
    });
    mockOnFilterChange.mockClear();

    // Clear dates
    fireEvent.click(screen.getByRole("button", { name: /clear dates/i }));

    // Should emit with only the type (no dates)
    expect(mockOnFilterChange).toHaveBeenCalledWith({ entryType: "symptom" });
    // Date inputs should be empty
    expect(screen.getByLabelText(/start date/i)).toHaveValue("");
    expect(screen.getByLabelText(/end date/i)).toHaveValue("");
  });

  it("clears date error when dates are cleared", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    // Create invalid state
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: "2024-02-01" },
    });

    expect(
      screen.getByText("Start date must not be after end date")
    ).toBeInTheDocument();

    // Clear dates
    fireEvent.click(screen.getByRole("button", { name: /clear dates/i }));

    expect(
      screen.queryByText("Start date must not be after end date")
    ).not.toBeInTheDocument();
  });

  it("allows same start and end date (valid range)", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: "2024-01-15" },
    });
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2024-01-15" },
    });

    expect(
      screen.queryByText("Start date must not be after end date")
    ).not.toBeInTheDocument();
    expect(mockOnFilterChange).toHaveBeenLastCalledWith({
      startDate: "2024-01-15",
      endDate: "2024-01-15",
    });
  });

  it("does not emit type filter change when date range is invalid", () => {
    render(<EntryFilters onFilterChange={mockOnFilterChange} />);

    // Create invalid date state
    fireEvent.change(screen.getByLabelText(/end date/i), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/start date/i), {
      target: { value: "2024-02-01" },
    });
    mockOnFilterChange.mockClear();

    // Clicking type should not emit (dates are invalid)
    fireEvent.click(screen.getByRole("button", { name: /food/i }));

    expect(mockOnFilterChange).not.toHaveBeenCalled();
  });
});
