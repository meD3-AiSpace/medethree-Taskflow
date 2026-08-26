"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, Plus, ShieldCheck, UserCheck, Smartphone, Menu } from "lucide-react";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { currentUser, setCurrentUser, users, notifications, markAllNotificationsAsRead } = useTaskStore();
  const { t, lang } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotifPopover, setShowNotifPopover] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Hamburger + Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Button */}
        {onOpenMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMobileMenu}
            className="md:hidden h-9 w-9 text-foreground hover:bg-accent"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Role Switcher for Testing (RBAC Demonstration) */}
        <span className="text-xs text-muted-foreground hidden sm:inline">{t("switchRole")}</span>
        <select
          value={currentUser.id}
          onChange={(e) => {
            const selected = users.find((u) => u.id === e.target.value);
            if (selected) setCurrentUser(selected);
          }}
          className="h-8 text-xs rounded-md border border-input bg-background px-2 py-1 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-none max-w-[170px] sm:max-w-[280px] truncate"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name} ({u.role.toUpperCase()})
            </option>
          ))}
        </select>

        <Badge
          variant={
            currentUser.role === "admin"
              ? "default"
              : currentUser.role === "manager"
              ? "high"
              : "medium"
          }
          className="capitalize text-[11px] hidden md:inline-flex"
        >
          {t("roleLabel")}: {currentUser.role}
        </Badge>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Bilingual Flag Switcher: 🇹🇭 TH / 🇬🇧 EN */}
        <LanguageSwitcher />

        {/* LINE Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
          <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
          <span>
            {currentUser.line_user_id ? t("lineConnected") : t("lineNotConnected")}
          </span>
        </div>

        {/* Notifications Direct Link Button */}
        <Link href="/notifications" title={lang === "th" ? "การแจ้งเตือนทั้งหมด" : "All Notifications"}>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 relative hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-950 transition-all cursor-pointer"
          >
            <Bell className="h-4 w-4 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </Button>
        </Link>

        {/* Create Task Button */}
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 sm:h-9 px-2 sm:px-3 gap-1 sm:gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("createTaskBtn")}</span>
        </Button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l">
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarFallback className="text-xs">{currentUser.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold leading-tight">{currentUser.full_name}</div>
            <div className="text-[10px] text-muted-foreground">{currentUser.email}</div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
        />
      )}
    </header>
  );
}
