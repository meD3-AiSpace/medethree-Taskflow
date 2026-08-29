"use client";

import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { OfflineOutboxService } from "@/lib/sync/offline-outbox";
import { RealtimeSyncService, RealtimeStatus } from "@/lib/supabase/realtime-service";
import { useLanguage } from "@/lib/i18n/language-context";

export function SyncStatusBadge() {
  const { lang } = useLanguage();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("DISCONNECTED");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    OfflineOutboxService.init();

    const unsubOutbox = OfflineOutboxService.subscribe((status) => {
      setIsOnline(status.isOnline);
      setIsSyncing(status.isSyncing);
      setPendingCount(status.pendingCount);
      if (status.lastSyncedAt) setLastSynced(status.lastSyncedAt);
    });

    const unsubRealtime = RealtimeSyncService.onStatusChange((status) => {
      setRealtimeStatus(status);
    });

    return () => {
      unsubOutbox();
      unsubRealtime();
    };
  }, []);

  const handleManualFlush = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await OfflineOutboxService.flushQueue();
    setIsSyncing(false);
  };

  // Determine visual state
  if (!isOnline) {
    return (
      <div
        onClick={handleManualFlush}
        title={lang === "th" ? `ออฟไลน์ (บันทึกลงเครื่อง ${pendingCount} รายการ)` : `Offline Mode (${pendingCount} queued)`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 cursor-pointer select-none transition-all hover:bg-rose-200"
      >
        <WifiOff className="h-3 w-3 shrink-0 text-rose-600 animate-pulse" />
        <span className="hidden sm:inline">{lang === "th" ? "ออฟไลน์" : "Offline"}</span>
        {pendingCount > 0 && (
          <span className="px-1 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-mono">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  if (isSyncing || pendingCount > 0) {
    return (
      <div
        onClick={handleManualFlush}
        title={lang === "th" ? `กำลังซิงค์ข้อมูล (${pendingCount} รายการค้างส่ง)...` : `Syncing ${pendingCount} items...`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 cursor-pointer select-none transition-all hover:bg-amber-200"
      >
        <RefreshCw className="h-3 w-3 shrink-0 text-amber-600 animate-spin" />
        <span className="hidden sm:inline">{lang === "th" ? "กำลังซิงค์" : "Syncing"}</span>
        {pendingCount > 0 && (
          <span className="px-1 py-0.2 rounded-full bg-amber-600 text-white text-[9px] font-mono">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  if (realtimeStatus === "LIVE") {
    return (
      <div
        onClick={handleManualFlush}
        title={lang === "th" ? "เชื่อมต่อ Real-time WebSockets สด (<200ms)" : "Live Real-time WebSockets Connected"}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-pointer select-none transition-all hover:bg-emerald-100"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="hidden sm:inline">{lang === "th" ? "สด Real-time" : "Live"}</span>
      </div>
    );
  }

  return (
    <div
      onClick={handleManualFlush}
      title={lang === "th" ? "เชื่อมต่อคลาวด์ปกติ (กดเพื่อซิงค์ข้อมูล)" : "Cloud Connected (Click to sync)"}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/80 cursor-pointer select-none transition-all hover:text-foreground"
    >
      <Wifi className="h-3 w-3 shrink-0 text-emerald-600" />
      <span className="hidden sm:inline">{lang === "th" ? "ออนไลน์" : "Online"}</span>
    </div>
  );
}
