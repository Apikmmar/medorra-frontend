"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Fired on click — e.g. to close the mobile drawer after navigating. */
  onNavigate?: () => void;
}

export function NavItem({ href, label, icon, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-accent/10 text-accent-text"
          : "text-muted hover:bg-surface-2 hover:text-fg"
      }`}
    >
      {/* Active indicator bar */}
      <span
        className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent transition-opacity ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />
      <span
        className={`h-5 w-5 flex-shrink-0 transition-colors ${
          isActive ? "text-accent-text" : "text-faint group-hover:text-fg"
        }`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
