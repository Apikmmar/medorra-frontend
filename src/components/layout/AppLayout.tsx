"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { Logo } from "./Logo";
import { MenuIcon } from "./icons";
import { AuthGuard } from "@/components/auth";
import { ThemeToggle } from "@/components/theme";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Auth pages get a clean layout without sidebar/nav
  if (pathname?.startsWith("/auth")) {
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen min-w-[320px]">
        {/* Sidebar - visible on tablet (collapsible) and desktop (persistent) */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {/* Offline banner - visible when offline or entries pending */}
          <OfflineBanner />

          {/* Top header bar for tablet with hamburger menu */}
          <header className="sticky top-0 z-20 hidden h-16 items-center border-b border-border bg-surface/80 px-4 backdrop-blur tablet:flex desktop:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Open navigation menu"
            >
              <span className="block h-5 w-5">
                <MenuIcon />
              </span>
            </button>
            <span className="ml-3">
              <Logo />
            </span>
            <ThemeToggle className="ml-auto" />
          </header>

          {/* Mobile top bar */}
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface/80 px-2 backdrop-blur tablet:hidden">
            <span className="w-10" aria-hidden="true" />
            <Logo />
            <ThemeToggle />
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 pb-24 tablet:p-6 tablet:pb-6 desktop:p-8">
            {children}
          </main>
        </div>

        {/* Bottom navigation - mobile only */}
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
