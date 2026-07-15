"use client";

import { X } from "lucide-react";
import { NavItem, NavItemProps } from "./NavItem";
import { Logo } from "./Logo";
import { Sheet, SheetContent, SheetClose, DialogTitle } from "@/components/ui";
import {
  HomeIcon,
  PlusCircleIcon,
  TimelineIcon,
  InsightsIcon,
  TrendsIcon,
  SettingsIcon,
} from "./icons";

const navItems: Omit<NavItemProps, "onNavigate">[] = [
  { href: "/", label: "Dashboard", icon: <HomeIcon /> },
  { href: "/entries/new", label: "Log Entry", icon: <PlusCircleIcon /> },
  { href: "/timeline", label: "Timeline", icon: <TimelineIcon /> },
  { href: "/insights", label: "Insights", icon: <InsightsIcon /> },
  { href: "/trends", label: "Trends", icon: <TrendsIcon /> },
  { href: "/settings", label: "Settings", icon: <SettingsIcon /> },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

/** Shared navigation body used by both the desktop rail and the tablet drawer. */
function NavBody({
  onNavigate,
  showClose,
}: {
  onNavigate?: () => void;
  showClose?: boolean;
}) {
  return (
    <>
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        {showClose && (
          <SheetClose
            aria-label="Close navigation menu"
            className="rounded-md p-1 text-muted transition-colors hover:bg-surface-2 hover:text-fg focus:outline-none focus:ring-2 focus:ring-accent/60"
          >
            <X className="h-5 w-5" />
          </SheetClose>
        )}
      </div>
      <nav className="flex flex-col gap-1 px-3" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="mt-auto px-5 py-4">
        <p className="text-xs text-faint">Medorra · AI Symptom Diary</p>
      </div>
    </>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Tablet drawer — Radix Sheet gives focus-trap + Escape-to-close */}
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="left" className="flex flex-col p-0 desktop:hidden">
          <DialogTitle className="sr-only">Navigation menu</DialogTitle>
          <NavBody onNavigate={onClose} showClose />
        </SheetContent>
      </Sheet>

      {/* Desktop persistent rail */}
      <aside className="hidden w-64 flex-col self-stretch border-r border-border bg-surface desktop:flex">
        <NavBody />
      </aside>
    </>
  );
}
