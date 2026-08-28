"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Plus, Menu, RefreshCw, LogOut, UserCheck, ChevronDown, Sparkles } from "lucide-react";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LighthouseLogo } from "@/components/ui/lighthouse-logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const router = useRouter();
  const { currentUser, users, login, logout, notifications, isSyncing, syncCloudData } = useTaskStore();
  const { t, lang } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const handleSwitchUser = (user: (typeof users)[0]) => {
    login(user);
    setShowSwitchModal(false);
    setShowUserMenu(false);
  };

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
        <Link href="/dashboard" prefetch={false} className="md:hidden flex items-center">
          <LighthouseLogo size="xs" showText={false} />
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              currentUser?.role === "admin"
                ? "default"
                : currentUser?.role === "manager"
                ? "high"
                : "medium"
            }
            className="capitalize text-[11px] font-semibold"
          >
            {currentUser?.role?.toUpperCase() || "MEMBER"}
          </Badge>
          <span className="text-xs font-bold text-foreground hidden sm:inline truncate max-w-[220px]">
            {currentUser?.full_name || "ผู้ใช้งาน"}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Bilingual Flag Switcher: 🇹🇭 TH / 🇬🇧 EN */}
        <LanguageSwitcher />

        {/* Manual Cloud Sync Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => syncCloudData()}
          disabled={isSyncing}
          title={
            lang === "th"
              ? isSyncing
                ? "กำลังซิงค์ข้อมูลกับคลาวด์..."
                : "กดเพื่อซิงค์ข้อมูลล่าสุดกับคลาวด์ (Cloud Sync)"
              : isSyncing
              ? "Syncing cloud data..."
              : "Click to sync latest data with cloud"
          }
          className={`h-8 w-8 sm:h-9 sm:w-9 relative transition-all cursor-pointer ${
            isSyncing
              ? "bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950"
              : "hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-950 text-muted-foreground hover:text-emerald-600"
          }`}
          aria-label="Sync cloud data"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
        </Button>

        {/* Notifications Direct Link Button */}
        <Link href="/notifications" prefetch={false} title={lang === "th" ? "การแจ้งเตือนทั้งหมด" : "All Notifications"}>
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
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 sm:h-9 px-2 sm:px-3 gap-1 sm:gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t("createTaskBtn")}</span>
        </Button>

        {/* Interactive User Profile Dropdown Menu */}
        <div className="relative pl-1.5 sm:pl-2 border-l" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-lg hover:bg-accent/70 transition-colors cursor-pointer text-left"
          >
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-border">
              <AvatarFallback className="text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {(currentUser?.full_name || "?").trim().charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold leading-tight flex items-center gap-1">
                <span>{currentUser?.full_name || "ผู้ใช้งาน"}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="text-[10px] text-muted-foreground">{currentUser?.email || ""}</div>
            </div>
          </button>

          {/* Profile Dropdown Box */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border bg-card p-2 shadow-xl z-50 text-xs animate-in fade-in space-y-1">
              <div className="p-2.5 rounded-lg bg-muted/40 space-y-1 border-b pb-2">
                <div className="font-bold text-foreground">{currentUser?.full_name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{currentUser?.email}</div>
                <Badge
                  variant={
                    currentUser?.role === "admin"
                      ? "default"
                      : currentUser?.role === "manager"
                      ? "high"
                      : "medium"
                  }
                  className="text-[9px] uppercase font-bold mt-1"
                >
                  ROLE: {currentUser?.role}
                </Badge>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  setShowSwitchModal(true);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-foreground font-medium transition-colors cursor-pointer text-left"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>{lang === "th" ? "🔄 สลับโปรไฟล์ผู้ใช้ (Switch Profile)" : "🔄 Switch User Profile"}</span>
              </button>

              <Link
                href="/settings"
                onClick={() => setShowUserMenu(false)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-foreground font-medium transition-colors cursor-pointer text-left"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>{lang === "th" ? "⚙️ การตั้งค่าระบบ (Settings)" : "⚙️ System Settings"}</span>
              </Link>

              <div className="border-t pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium transition-colors cursor-pointer text-left"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-600" />
                  <span>{lang === "th" ? "🚪 ออกจากระบบ (Sign Out)" : "🚪 Sign Out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Switch User Modal Dialog */}
      {showSwitchModal && (
        <Dialog open={showSwitchModal} onOpenChange={setShowSwitchModal}>
          <DialogContent className="max-w-md" onClose={() => setShowSwitchModal(false)}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <span>{lang === "th" ? "เลือกบัญชีผู้ใช้ที่ต้องการสลับใช้งาน" : "Select User Profile to Switch"}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2 max-h-80 overflow-y-auto pt-2">
              {users.map((u) => {
                const isSelected = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSwitchUser(u)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 shadow-xs"
                        : "hover:bg-muted/50 border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs font-bold">
                          {(u.full_name || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          <span>{u.full_name}</span>
                          {isSelected && (
                            <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">
                              {lang === "th" ? "ปัจจุบัน" : "Active"}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        u.role === "admin"
                          ? "default"
                          : u.role === "manager"
                          ? "high"
                          : "medium"
                      }
                      className="text-[9px] uppercase font-bold"
                    >
                      {u.role}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}

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
