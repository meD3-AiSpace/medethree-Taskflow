"use client";

import React from "react";
import Link from "next/link";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, AlertCircle, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

export default function NotificationsPage() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useTaskStore();
  const { t, lang } = useLanguage();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Bell className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {lang === "th" ? "ศูนย์การแจ้งเตือน (Notifications Center)" : "Notifications Center"}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === "th"
              ? "บันทึกการแจ้งเตือนทั้งหมด ทั้ง In-App และ LINE Messaging API"
              : "All system notifications across In-App and LINE Messaging API"}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllNotificationsAsRead}
            className="text-xs"
          >
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 rounded-xl border border-dashed text-center bg-card">
            <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">{t("noNotifications")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === "th"
                ? "เมื่อมีงานมอบหมายใหม่หรือการอัปเดต จะปรากฏที่นี่"
                : "New task assignments and updates will appear here"}
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const displayTitle = getLocalizedDynamicText(notif.title, notif.title_en, lang);
            const displayMessage = getLocalizedDynamicText(notif.message, notif.message_en, lang);

            const content = (
              <div
                onClick={() => markNotificationAsRead(notif.id)}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 text-xs cursor-pointer group ${
                  notif.is_read
                    ? "bg-card/60 text-muted-foreground border-border hover:border-muted-foreground/40 hover:bg-muted/20"
                    : "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-xs hover:border-emerald-500 hover:shadow-md hover:bg-emerald-50/80 dark:hover:bg-emerald-950/50"
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-110 ${
                      notif.type === "issue_logged"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : notif.type === "due_soon" || notif.type === "overdue"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    }`}
                  >
                    {notif.type === "issue_logged" ? (
                      <ShieldAlert className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-xs group-hover:text-emerald-600 transition-colors">
                        {displayTitle}
                      </span>
                      {!notif.is_read && (
                        <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-foreground leading-relaxed font-normal">{displayMessage}</p>
                    <span className="text-[10px] text-muted-foreground block">
                      {formatDateTime(notif.created_at, lang)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-1">
                  <span className="hidden sm:inline">{lang === "th" ? "เปิดดูงาน" : "View"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            );

            return notif.task_id ? (
              <Link key={notif.id} href={`/tasks/${notif.task_id}`} className="block">
                {content}
              </Link>
            ) : (
              <div key={notif.id}>{content}</div>
            );
          })
        )}
      </div>
    </div>
  );
}
