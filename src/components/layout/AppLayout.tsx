"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { MenuIcon } from "./icons";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen min-w-[320px]">
      {/* Sidebar - visible on tablet (collapsible) and desktop (persistent) */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Offline banner - visible when offline or entries pending */}
        <OfflineBanner />

        {/* Top header bar for tablet with hamburger menu */}
        <header className="sticky top-0 z-20 hidden border-b border-gray-200 bg-white tablet:flex desktop:hidden items-center h-16 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Open navigation menu"
          >
            <span className="h-5 w-5 block">
              <MenuIcon />
            </span>
          </button>
          <span className="ml-3 text-lg font-semibold text-indigo-700">
            Medorra
          </span>
        </header>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-center border-b border-gray-200 bg-white h-14 tablet:hidden">
          <span className="text-lg font-semibold text-indigo-700">Medorra</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 pb-20 tablet:p-6 tablet:pb-6 desktop:p-8">
          {children}
        </main>
      </div>

      {/* Bottom navigation - mobile only */}
      <BottomNav />
    </div>
  );
}
