"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Kanban,
  Calendar,
  FileCheck2,
  FileSpreadsheet,
  ListTodo,
  Users,
  Settings,
  Bell,
  Layers,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { LighthouseLogo } from "@/components/ui/lighthouse-logo";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { tasks, issues, notifications, currentUser } = useTaskStore();
  const { t, lang } = useLanguage();

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
    if (pathname === href) {
      e.preventDefault();
      return;
    }

    try {
      router.push(href);
    } catch {
      window.location.href = href;
      return;
    }

    if (typeof window !== "undefined") {
      const initialPath = window.location.pathname;
      setTimeout(() => {
        if (window.location.pathname === initialPath && window.location.pathname !== href) {
          window.location.href = href;
        }
      }, 350);
    }
  };

  const activeTaskIds = new Set(tasks.map((t) => t.id));
  const unresolvedIssuesCount = issues.filter((i) => !i.is_resolved && activeTaskIds.has(i.task_id)).length;
  const unreadNotifsCount = notifications.filter((n) => !n.is_read && (!n.task_id || activeTaskIds.has(n.task_id))).length;
  const permitTasksCount = tasks.filter((t) => t.category === "permit").length;

  const isAdmin = currentUser?.role === "admin";

  const navItems = [
    {
      label: t("navDashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: lang === "th" ? "กระดานติดตามงาน (Tasks)" : "Task Management",
      href: "/tasks",
      icon: CheckSquare,
      badge: tasks.length,
      activeMatch: ["/tasks", "/board", "/my-tasks"],
    },
    {
      label: lang === "th" ? "ปฏิทินงาน (Calendar)" : "Calendar View",
      href: "/calendar",
      icon: Calendar,
    },
    {
      label: t("navPermits"),
      href: "/permits",
      icon: FileCheck2,
      badge: permitTasksCount,
      highlight: true,
    },
    {
      label: lang === "th" ? "รายงานสรุป (Reports)" : "Reports & Analytics",
      href: "/reports",
      icon: FileSpreadsheet,
    },
    {
      label: t("navTeams"),
      href: "/teams",
      icon: Users,
    },
    ...(isAdmin
      ? [
          {
            label: t("navSettings"),
            href: "/settings",
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container: Fixed on Mobile Drawer, Static on Desktop */}
      <aside
        className={cn(
          "w-64 border-r bg-card h-screen flex flex-col shrink-0 z-40 transition-transform duration-300 ease-in-out",
          "fixed md:static inset-y-0 left-0",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 border-b flex items-center justify-between px-4 gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer group">
            <LighthouseLogo size="sm" showText={true} />
          </Link>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCloseMobile}
              className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t("navMenu")}
          </div>

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
                onClick={(e) => {
                  handleNavClick(item.href, e);
                }}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group cursor-pointer",
                  isActive
                    ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground group-hover:bg-accent-foreground/10"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Unresolved Issues Alert Banner (Pulsing Urgent Warning) */}
        {unresolvedIssuesCount > 0 && (
          <Link href="/tasks?filter=issues" onClick={onCloseMobile} className="block mx-3 mb-3 group">
            <div className="p-3 rounded-lg bg-rose-100/70 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 animate-urgent-badge hover:bg-rose-100 transition-colors">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-black">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 animate-urgent-dot" />
                <span className="animate-urgent-text">{t("sidebarIssueAlert", { count: unresolvedIssuesCount })}</span>
              </div>
              <p className="text-[11px] text-rose-700/90 dark:text-rose-300 mt-1 leading-snug font-medium">
                {t("sidebarIssueSub")}
              </p>
            </div>
          </Link>
        )}

        {/* Org Info Footer */}
        <div className="p-3 border-t bg-muted/30">
          <div className="text-[11px] font-medium text-foreground truncate">
            🏢 MeDTree Design & Build
          </div>
          <div className="text-[10px] text-muted-foreground truncate">
            Multi-tenant Org ID: 11111111...
          </div>
        </div>
      </aside>
    </>
  );
}
