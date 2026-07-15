"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  PlusCircleIcon,
  TimelineIcon,
  InsightsIcon,
  TrendsIcon,
  SettingsIcon,
} from "./icons";

const bottomNavItems = [
  { href: "/", label: "Home", icon: <HomeIcon /> },
  { href: "/entries/new", label: "Log", icon: <PlusCircleIcon /> },
  { href: "/timeline", label: "Timeline", icon: <TimelineIcon /> },
  { href: "/insights", label: "Insights", icon: <InsightsIcon /> },
  { href: "/trends", label: "Trends", icon: <TrendsIcon /> },
  { href: "/settings", label: "Settings", icon: <SettingsIcon /> },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur tablet:hidden"
      aria-label="Mobile navigation"
      role="navigation"
    >
      <ul className="flex items-center justify-around px-1" role="list">
        {bottomNavItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={`group flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? "text-accent-text" : "text-faint hover:text-fg"
                }`}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                    isActive ? "bg-accent/15" : "group-hover:bg-surface-2"
                  }`}
                  aria-hidden="true"
                >
                  <span className="h-5 w-5">{item.icon}</span>
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
