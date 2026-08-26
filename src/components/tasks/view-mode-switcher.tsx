"use client";

import React from "react";
import Link from "next/link";
import { Kanban, List, Calendar as CalendarIcon } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { cn } from "@/lib/utils";

interface ViewModeSwitcherProps {
  currentMode: "board" | "list" | "calendar";
}

export function ViewModeSwitcher({ currentMode }: ViewModeSwitcherProps) {
  const { t, lang } = useLanguage();

  const modes = [
    {
      id: "board",
      label: lang === "th" ? "บอร์ดคันบัง" : "Kanban Board",
      shortLabel: lang === "th" ? "บอร์ด" : "Board",
      href: "/board",
      icon: Kanban,
    },
    {
      id: "list",
      label: lang === "th" ? "ตารางรายการ" : "List Table",
      shortLabel: lang === "th" ? "รายการ" : "List",
      href: "/tasks",
      icon: List,
    },
    {
      id: "calendar",
      label: lang === "th" ? "ปฏิทินงาน" : "Calendar View",
      shortLabel: lang === "th" ? "ปฏิทิน" : "Calendar",
      href: "/calendar",
      icon: CalendarIcon,
    },
  ];

  return (
    <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border shadow-xs gap-1">
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;
        const Icon = mode.icon;

        return (
          <Link
            key={mode.id}
            href={mode.href}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
              isActive
                ? "bg-background text-emerald-700 dark:text-emerald-400 shadow-sm border border-border/80"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")} />
            <span className="hidden sm:inline">{mode.label}</span>
            <span className="sm:hidden">{mode.shortLabel}</span>
          </Link>
        );
      })}
    </div>
  );
}
