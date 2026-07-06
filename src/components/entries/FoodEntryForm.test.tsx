import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoodEntryForm } from "./FoodEntryForm";

// Mock the API client
vi.mock("@/lib/api/client", () => ({
  apiClient: {
    post: vi.fn().mockResolvedValue({ data: {}, status: 201, ok: true }),
  },
}));

describe("FoodEntryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders meal type dropdown and initial food item", () => {
    render(<FoodEntryForm />);

    expect(screen.getByLabelText(/meal type/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("shows validation error for unselected meal type", async () => {
    render(<FoodEntryForm />);

    const select = screen.getByLabelText(/meal type/i);
    fireEvent.blur(select);

    await waitFor(() => {
      expect(screen.getByText("Meal type is required")).toBeInTheDocument();
    });
  });

  it("shows validation error for empty food description", async () => {
    render(<FoodEntryForm />);

    const descInput = screen.getByLabelText(/description/i);
    fireEvent.focus(descInput);
    fireEvent.blur(descInput);

    await waitFor(() => {
      expect(screen.getByText("Food description is required")).toBeInTheDocument();
    });
  });

  it("shows validation error for description exceeding 500 chars", async () => {
    render(<FoodEntryForm />);

    const descInput = screen.getByLabelText(/description/i);
    const longText = "a".repeat(501);
    fireEvent.change(descInput, { target: { value: longText } });

    await waitFor(() => {
      expect(screen.getByText("Description must be 500 characters or less")).toBeInTheDocument();
    });
  });

  it("can add and remove food items", async () => {
    render(<FoodEntryForm />);

    // Initially 1 item
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.queryByText("Item 2")).not.toBeInTheDocument();

    // Add item
    const addButton = screen.getByRole("button", { name: /add food item/i });
    fireEvent.click(addButton);

    expect(screen.getByText("Item 2")).toBeInTheDocument();

    // Remove item 1
    const removeButtons = screen.getAllByRole("button", { name: /remove food item/i });
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Item 2")).not.toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
    });
  });

  it("respects max 20 food items limit", () => {
    render(<FoodEntryForm />);

    const addButton = screen.getByRole("button", { name: /add food item/i });

    // Add 19 more items (total 20)
    for (let i = 0; i < 19; i++) {
      fireEvent.click(addButton);
    }

    // Button should be disabled at 20
    expect(addButton).toBeDisabled();
    expect(screen.getByText("Item 20")).toBeInTheDocument();
  });

  it("accepts valid input without errors", async () => {
    const { apiClient } = await import("@/lib/api/client");

    render(<FoodEntryForm />);

    // Select meal type
    const select = screen.getByLabelText(/meal type/i);
    fireEvent.change(select, { target: { value: "lunch" } });

    // Enter description
    const descInput = screen.getByLabelText(/description/i);
    fireEvent.change(descInput, { target: { value: "Grilled chicken salad" } });

    // Submit
    const submitButton = screen.getByRole("button", { name: /save food entry/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/entries/food", {
        entryType: "food",
        mealType: "lunch",
        items: [{ description: "Grilled chicken salad", tags: [] }],
      });
    });

    // No errors shown
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows validation errors on submit when form is invalid", async () => {
    render(<FoodEntryForm />);

    // Submit without filling anything
    const submitButton = screen.getByRole("button", { name: /save food entry/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Meal type is required")).toBeInTheDocument();
      expect(screen.getByText("Food description is required")).toBeInTheDocument();
    });
  });
});
