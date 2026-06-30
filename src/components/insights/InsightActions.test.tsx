import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InsightActions } from "./InsightActions";

const mockPost = vi.fn();

vi.mock("@/lib/api/client", () => ({
  apiClient: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

describe("InsightActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dismiss and confirm buttons for active insight", () => {
    render(
      <InsightActions
        insightId="insight-1"
        status="active"
        onDismiss={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /dismiss insight/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm insight/i })
    ).toBeInTheDocument();
  });

  it("renders nothing when status is dismissed", () => {
    const { container } = render(
      <InsightActions
        insightId="insight-1"
        status="dismissed"
        onDismiss={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("shows Confirmed badge when status is confirmed", () => {
    render(
      <InsightActions
        insightId="insight-1"
        status="confirmed"
        onDismiss={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText("Confirmed ✓")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /dismiss insight/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /confirm insight/i })
    ).not.toBeInTheDocument();
  });

  it("calls API and triggers onDismiss when dismiss is clicked", async () => {
    const onDismiss = vi.fn();
    mockPost.mockResolvedValue({
      data: { insightId: "insight-1", status: "dismissed" },
      status: 200,
      ok: true,
    });

    render(
      <InsightActions
        insightId="insight-1"
        status="active"
        onDismiss={onDismiss}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /dismiss insight/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/insights/insight-1/respond", {
        response: "dismiss",
      });
    });

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith("insight-1");
    });
  });

  it("calls API and triggers onConfirm when confirm is clicked", async () => {
    const onConfirm = vi.fn();
    mockPost.mockResolvedValue({
      data: { insightId: "insight-1", status: "confirmed" },
      status: 200,
      ok: true,
    });

    render(
      <InsightActions
        insightId="insight-1"
        status="active"
        onDismiss={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /confirm insight/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/insights/insight-1/respond", {
        response: "confirm",
      });
    });

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("insight-1");
    });
  });

  it("shows loading state on dismiss button during API call", async () => {
    mockPost.mockReturnValue(new Promise(() => {})); // never resolves

    render(
      <InsightActions
        insightId="insight-1"
        status="active"
        onDismiss={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /dismiss insight/i }));

    await waitFor(() => {
      expect(screen.getByText("Dismissing...")).toBeInTheDocument();
    });

    // Both buttons should be disabled during loading
    expect(
      screen.getByRole("button", { name: /dismiss insight/i })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /confirm insight/i })
    ).toBeDisabled();
  });

  it("shows loading state on confirm button during API call", async () => {
    mockPost.mockReturnValue(new Promise(() => {})); // never resolves

    render(
      <InsightActions
        insightId="insight-1"
        status="active"
        onDismiss={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /confirm insight/i }));

    await waitFor(() => {
      expect(screen.getByText("Confirming...")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /dismiss insight/i })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /confirm insight/i })
    ).toBeDisabled();
  });

  it("shows error message on API failure for dismiss", async () => {
    mockPost.mockRejectedValue(new Error("Network error"));

    render(
      <InsightActions
        insightId="insight-1"
        status="active"
        onDismiss={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /dismiss insight/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("shows error message on API failure for confirm", async () => {
    mockPost.mockRejectedValue(new Error("Server unavailable"));

    render(
      <InsightActions
        insightId="insight-1"
        status="active"
        onDismiss={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /confirm insight/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Server unavailable")).toBeInTheDocument();
    });
  });

  it("clears previous error when retrying", async () => {
    mockPost.mockRejectedValueOnce(new Error("Network error"));

    render(
      <InsightActions
        insightId="insight-1"
        status="active"
        onDismiss={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /dismiss insight/i }));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    mockPost.mockResolvedValueOnce({
      data: { insightId: "insight-1", status: "dismissed" },
      status: 200,
      ok: true,
    });

    fireEvent.click(screen.getByRole("button", { name: /dismiss insight/i }));

    await waitFor(() => {
      expect(screen.queryByText("Network error")).not.toBeInTheDocument();
    });
  });
});
