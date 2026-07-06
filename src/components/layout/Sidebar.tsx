"use client";

import { NavItem, NavItemProps } from "./NavItem";
import { Logo } from "./Logo";
import {
  HomeIcon,
  PlusCircleIcon,
  TimelineIcon,
  InsightsIcon,
  SettingsIcon,
  CloseIcon,
} from "./icons";

const navItems: NavItemProps[] = [
  { href: "/", label: "Dashboard", icon: <HomeIcon /> },
  { href: "/entries/new", label: "Log Entry", icon: <PlusCircleIcon /> },
  { href: "/timeline", label: "Timeline", icon: <TimelineIcon /> },
  { href: "/insights", label: "Insights", icon: <InsightsIcon /> },
  { href: "/settings", label: "Settings", icon: <SettingsIcon /> },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop for tablet when sidebar is open */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 tablet:block desktop:hidden"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out
          desktop:translate-x-0 desktop:static desktop:z-0 desktop:shadow-none desktop:border-r desktop:border-gray-200
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Main navigation"
        role="navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <Logo />
          <button
            onClick={onClose}
            className="desktop:hidden rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close navigation menu"
          >
            <span className="h-5 w-5 block">
              <CloseIcon />
            </span>
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4" aria-label="Primary">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>
      </aside>
    </>
  );
}
