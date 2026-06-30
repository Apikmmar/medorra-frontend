import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppLayout } from "./AppLayout";
import { OfflineProvider } from "@/lib/offline";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

// Mock useAuth to simulate an authenticated user
vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    isSessionExpired: false,
    user: { userId: "test-user", email: "test@example.com" },
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AuthApiConnector: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: any;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock IndexedDB for OfflineProvider
vi.mock("@/lib/offline/indexed-db", () => ({
  addEntry: vi.fn(),
  getAllEntries: vi.fn().mockResolvedValue([]),
  getEntryCount: vi.fn().mockResolvedValue(0),
  removeEntry: vi.fn(),
  clearAll: vi.fn(),
}));

function renderWithOffline(ui: React.ReactElement) {
  return render(<OfflineProvider>{ui}</OfflineProvider>);
}

describe("AppLayout", () => {
  it("renders children content", () => {
    renderWithOffline(
      <AppLayout>
        <div data-testid="child-content">Hello World</div>
      </AppLayout>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders the Medorra brand name", () => {
    renderWithOffline(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    const brandElements = screen.getAllByText("Medorra");
    expect(brandElements.length).toBeGreaterThan(0);
  });

  it("renders navigation with proper ARIA labels", () => {
    renderWithOffline(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    // Sidebar navigation should have aria-label
    const sidebarNav = screen.getByRole("navigation", {
      name: "Main navigation",
    });
    expect(sidebarNav).toBeInTheDocument();

    // Bottom navigation should have aria-label
    const mobileNav = screen.getByRole("navigation", {
      name: "Mobile navigation",
    });
    expect(mobileNav).toBeInTheDocument();
  });

  it("renders all main navigation links", () => {
    renderWithOffline(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    // Check navigation links exist (both in sidebar and bottom nav)
    const dashboardLinks = screen.getAllByRole("link", { name: /dashboard|home/i });
    expect(dashboardLinks.length).toBeGreaterThan(0);

    const timelineLinks = screen.getAllByRole("link", { name: /timeline/i });
    expect(timelineLinks.length).toBeGreaterThan(0);

    const insightsLinks = screen.getAllByRole("link", { name: /insights/i });
    expect(insightsLinks.length).toBeGreaterThan(0);

    const settingsLinks = screen.getAllByRole("link", { name: /settings/i });
    expect(settingsLinks.length).toBeGreaterThan(0);
  });

  it("renders links with correct href attributes", () => {
    renderWithOffline(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    // Check specific routes
    const links = screen.getAllByRole("link");
    const hrefs = links.map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("/");
    expect(hrefs).toContain("/entries/new");
    expect(hrefs).toContain("/timeline");
    expect(hrefs).toContain("/insights");
    expect(hrefs).toContain("/settings");
  });

  it("marks active page link with aria-current", () => {
    renderWithOffline(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    // Since we mock pathname as "/", dashboard links should be marked current
    const currentLinks = screen.getAllByRole("link", { current: "page" });
    expect(currentLinks.length).toBeGreaterThan(0);
  });

  it("has a min-width of 320px on the container", () => {
    const { container } = renderWithOffline(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    // The root container div should have min-w-[320px] class
    const rootDiv = container.firstElementChild;
    expect(rootDiv?.className).toContain("min-w-[320px]");
  });

  it("renders open menu button for tablet view", () => {
    renderWithOffline(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    const openMenuBtn = screen.getByRole("button", {
      name: "Open navigation menu",
    });
    expect(openMenuBtn).toBeInTheDocument();
  });

  it("renders close menu button in sidebar", () => {
    renderWithOffline(
      <AppLayout>
        <div>Content</div>
      </AppLayout>
    );

    const closeMenuBtn = screen.getByRole("button", {
      name: "Close navigation menu",
    });
    expect(closeMenuBtn).toBeInTheDocument();
  });
});
