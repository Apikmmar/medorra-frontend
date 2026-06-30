import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntryActions } from "./EntryActions";

describe("EntryActions", () => {
  const mockEntry = { entryId: "entry-123", entryType: "symptom" as const };

  it("renders edit and delete buttons", () => {
    render(
      <EntryActions entry={mockEntry} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    expect(
      screen.getByRole("button", { name: /edit symptom entry/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete symptom entry/i })
    ).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    render(
      <EntryActions entry={mockEntry} onEdit={onEdit} onDelete={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: /edit symptom entry/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(
      <EntryActions entry={mockEntry} onEdit={vi.fn()} onDelete={onDelete} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /delete symptom entry/i })
    );
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("uses the entry type in aria-labels", () => {
    render(
      <EntryActions
        entry={{ entryId: "e-1", entryType: "food" }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /edit food entry/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete food entry/i })
    ).toBeInTheDocument();
  });
});
