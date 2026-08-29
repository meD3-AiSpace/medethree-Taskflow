"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  FileCheck2,
  FileSpreadsheet,
  Bell,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";

export function MobileNav() {
  const pathname = usePathname();
  const { tasks, notifications, currentUser } = useTaskStore();
  const { lang } = useLanguage();

  const activeTaskIds = new Set(tasks.map((t) => t.id));
  const unreadNotifs = notifications.filter(
    (n) => !n.is_read && (!n.task_id || activeTaskIds.has(n.task_id))
  ).length;
  const permitCount = tasks.filter((t) => t.category === "permit").length;

  const isAdmin = currentUser?.role === "admin";

  const navItems = [
    {
      label: lang === "th" ? "แดชบอร์ด" : "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: lang === "th" ? "งาน" : "Tasks",
      href: "/tasks",
      icon: CheckSquare,
      badge: tasks.length > 0 ? tasks.length : undefined,
      activeMatch: ["/tasks", "/board", "/my-tasks"],
    },
    {
      label: lang === "th" ? "ใบอนุญาต" : "Permits",
      href: "/permits",
      icon: FileCheck2,
      badge: permitCount > 0 ? permitCount : undefined,
    },
    {
      label: lang === "th" ? "รายงาน" : "Reports",
      href: "/reports",
      icon: FileSpreadsheet,
    },
    {
      label: lang === "th" ? "แจ้งเตือน" : "Alerts",
      href: "/notifications",
      icon: Bell,
      badge: unreadNotifs > 0 ? unreadNotifs : undefined,
      badgeVariant: "destructive" as const,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 px-1 py-1 flex items-center justify-around shadow-xl print:hidden transform-gpu"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
    >
      {navItems.map((item) => {
        const isActive = item.activeMatch
          ? item.activeMatch.some((p) => pathname === p || (p !== "/" && pathname.startsWith(p + "/")))
          : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={cn(
              "flex flex-col items-center justify-center flex-1 min-w-0 py-1 px-1 rounded-xl transition-all duration-150 relative select-none cursor-pointer active:scale-90",
              isActive
                ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/60 dark:bg-emerald-950/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive ? "scale-110 text-emerald-600 dark:text-emerald-400" : ""
                )}
              />
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-black flex items-center justify-center leading-none text-white",
                    item.badgeVariant === "destructive" ? "bg-rose-500 animate-pulse" : "bg-emerald-600"
                  )}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
