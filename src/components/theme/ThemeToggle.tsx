"use client";

import { Banana, Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme, type ResolvedTheme } from "./ThemeProvider";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "banana", label: "Banana", icon: Banana },
  { value: "system", label: "System", icon: Monitor },
];

/** Icon shown on the toggle trigger for the theme currently in effect. */
function triggerIcon(resolved: ResolvedTheme) {
  if (resolved === "banana") return <Banana className="h-5 w-5" />;
  if (resolved === "light") return <Sun className="h-5 w-5" />;
  return <Moon className="h-5 w-5" />;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="Change theme"
        >
          {triggerIcon(resolvedTheme)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
            <Icon className="h-4 w-4 text-muted" />
            {label}
            {theme === value && (
              <Check className="ml-auto h-4 w-4 text-accent-text" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
