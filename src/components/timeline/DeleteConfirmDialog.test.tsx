import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

describe("DeleteConfirmDialog", () => {
  const mockEntry = { entryId: "entry-123", entryType: "symptom" as const };
  const defaultProps = {
    entry: mockEntry,
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <DeleteConfirmDialog {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the confirmation dialog when isOpen is true", () => {
    render(<DeleteConfirmDialog {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete Entry")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure you want to delete this symptom entry? This action cannot be undone."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("displays the correct entry type in the message", () => {
    render(
      <DeleteConfirmDialog
        {...defaultProps}
        entry={{ entryId: "entry-456", entryType: "medication" }}
      />
    );

    expect(
      screen.getByText(
        "Are you sure you want to delete this medication entry? This action cannot be undone."
      )
    ).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    render(<DeleteConfirmDialog {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Delete is clicked", () => {
    const onConfirm = vi.fn();
    render(<DeleteConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
