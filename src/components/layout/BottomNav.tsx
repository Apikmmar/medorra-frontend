"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  PlusCircleIcon,
  TimelineIcon,
  InsightsIcon,
  SettingsIcon,
} from "./icons";

const bottomNavItems = [
  { href: "/", label: "Home", icon: <HomeIcon /> },
  { href: "/entries/new", label: "Log", icon: <PlusCircleIcon /> },
  { href: "/timeline", label: "Timeline", icon: <TimelineIcon /> },
  { href: "/insights", label: "Insights", icon: <InsightsIcon /> },
  { href: "/settings", label: "Settings", icon: <SettingsIcon /> },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur tablet:hidden"
      aria-label="Mobile navigation"
      role="navigation"
    >
      <ul className="flex items-center justify-around" role="list">
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
                className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors ${
                  isActive ? "text-accent-text" : "text-muted"
                }`}
              >
                <span className="h-5 w-5" aria-hidden="true">
                  {item.icon}
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
