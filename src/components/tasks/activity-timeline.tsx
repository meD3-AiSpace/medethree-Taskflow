"use client";

import React from "react";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { formatDateTime, getStatusLabel } from "@/lib/utils";
import { History, ArrowRight, ShieldCheck } from "lucide-react";

interface ActivityTimelineProps {
  taskId: string;
}

export function ActivityTimeline({ taskId }: ActivityTimelineProps) {
  const { activityLogs } = useTaskStore();
  const { t, lang } = useLanguage();
  const taskLogs = activityLogs.filter((l) => l.task_id === taskId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-600" />
          <span>{lang === "th" ? "ประวัติกิจกรรมของงาน (Activity Log)" : "Task Activity Log"}</span>
        </h3>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>{lang === "th" ? "บันทึกอัตโนมัติ ห้ามแก้ไข/ลบ" : "Auto-logged, Tamper-proof"}</span>
        </div>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {taskLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            {lang === "th" ? "ยังไม่มีประวัติการแก้ไข" : "No activity logs yet"}
          </p>
        ) : (
          taskLogs.map((log) => (
            <div key={log.id} className="relative text-xs">
              {/* Dot */}
              <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-600 shadow-sm" />

              <div className="p-3 rounded-lg border bg-card/60 shadow-xs">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span className="font-semibold text-foreground">
                    {log.user?.full_name || (lang === "th" ? "ระบบ / ผู้ใช้" : "System / User")}
                  </span>
                  <span>{formatDateTime(log.created_at, lang)}</span>
                </div>

                <div className="text-xs">
                  {log.action === "status_changed" && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{lang === "th" ? "เปลี่ยนสถานะจาก" : "Changed status from"}</span>
                      <span className="px-1.5 py-0.5 rounded bg-muted font-medium">
                        {getStatusLabel(log.old_value || "", lang)}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                        {getStatusLabel(log.new_value || "", lang)}
                      </span>
                    </div>
                  )}

                  {log.action === "deadline_changed" && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{lang === "th" ? "แก้ไขกำหนดส่งเป็น:" : "Updated deadline to:"}</span>
                      <span className="font-semibold">{log.new_value}</span>
                    </div>
                  )}

                  {log.action === "priority_changed" && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{lang === "th" ? "ปรับระดับความสำคัญ:" : "Updated priority to:"}</span>
                      <span className="font-semibold">{log.new_value}</span>
                    </div>
                  )}

                  {log.action === "issue_raised" && (
                    <div>
                      <span className="text-rose-600 font-semibold">
                        {lang === "th" ? "บันทึกปัญหา: " : "Blocker logged: "}
                      </span>
                      <span>{log.new_value}</span>
                    </div>
                  )}

                  {log.action === "issue_resolved" && (
                    <div>
                      <span className="text-emerald-600 font-semibold">
                        {lang === "th" ? "แก้ไขปัญหาแล้ว: " : "Blocker resolved: "}
                      </span>
                      <span>{log.new_value}</span>
                    </div>
                  )}

                  {log.action === "permit_status_changed" && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{lang === "th" ? "เปลี่ยนสถานะใบขออนุญาตเป็น:" : "Updated permit status to:"}</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold">
                        {log.new_value}
                      </span>
                    </div>
                  )}

                  {log.action === "task_created" && (
                    <div className="text-muted-foreground">
                      {lang === "th" ? "สร้างงานใหม่ในระบบ" : "Created new task in system"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
