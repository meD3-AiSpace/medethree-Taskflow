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
import { LighthouseLogo } from "@/components/ui/lighthouse-logo";

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
      {/* Left: Mobile Hamburger + Brand Logo + Clean Profile Badge */}
      <div className="flex items-center gap-2.5">
        {/* Mobile Hamburger Button */}
        {onOpenMobileMenu && (
          <Button
            variant="outline"
            size="icon"
            onClick={onOpenMobileMenu}
            className="md:hidden h-9 w-9 text-foreground hover:bg-accent cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5 text-emerald-600" />
          </Button>
        )}

        {/* Mobile Brand Logo */}
        <Link href="/dashboard" className="md:hidden flex items-center">
          <LighthouseLogo size="xs" showText={false} />
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              currentUser.role === "admin"
                ? "default"
                : currentUser.role === "manager"
                ? "high"
                : "medium"
            }
            className="capitalize text-[11px] font-semibold"
          >
            {currentUser.role.toUpperCase()}
          </Badge>
          <span className="text-xs font-bold text-foreground hidden sm:inline truncate max-w-[220px]">
            {currentUser.full_name}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Bilingual Flag Switcher: 🇹🇭 TH / 🇬🇧 EN */}
        <LanguageSwitcher />

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
