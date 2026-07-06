"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function NavItem({ href, label, icon }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-brand-50 text-brand-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <span className="h-5 w-5 flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
