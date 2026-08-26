"use client";

import React from "react";
import { CheckCircle2, ShieldAlert, Clock, FileCheck2, Zap, ArrowUpRight, TrendingUp } from "lucide-react";
import { Task, TimeEntry, TaskIssue, TaskAttachment } from "@/lib/types/database.types";
import { Language } from "@/lib/i18n/translations";

interface ExecutiveKPICardsProps {
  tasks: Task[];
  timeEntries: TimeEntry[];
  issues: TaskIssue[];
  attachments: TaskAttachment[];
  lang: Language;
}

export function ExecutiveKPICards({
  tasks,
  timeEntries,
  issues,
  attachments,
  lang,
}: ExecutiveKPICardsProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "review").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalIssues = issues.length;
  const resolvedIssues = issues.filter((i) => i.is_resolved).length;
  const activeIssues = totalIssues - resolvedIssues;

  const totalMinutes = timeEntries.reduce((acc, t) => acc + (t.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const permitTasks = tasks.filter((t) => t.category === "permit");
  const approvedPermits = permitTasks.filter((t) => t.permit_details?.permit_status === "approved").length;

  const totalSavedPercent =
    attachments.length > 0
      ? Math.round(
          attachments.reduce((acc, a) => acc + (a.saved_percent || 0), 0) / attachments.length
        )
      : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* 1. Completion Rate */}
      <div className="p-4 rounded-xl border bg-card shadow-xs flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {lang === "th" ? "อัตราปิดงานสำเร็จ" : "Completion Rate"}
          </span>
          <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-foreground">{completionRate}%</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            <TrendingUp className="h-3 w-3" />
            <span>
              {lang === "th" ? `ปิดแล้ว ${completedTasks} / ${totalTasks} งาน` : `${completedTasks} of ${totalTasks} tasks`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Blockers & Issues Velocity */}
      <div className="p-4 rounded-xl border bg-card shadow-xs flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {lang === "th" ? "ปัญหาติดขัด (Blockers)" : "Blockers & Clashes"}
          </span>
          <div
            className={`h-7 w-7 rounded-lg flex items-center justify-center ${
              activeIssues > 0
                ? "bg-rose-100 dark:bg-rose-950 text-rose-600"
                : "bg-emerald-100 dark:bg-emerald-950 text-emerald-600"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-foreground">
            <span className={activeIssues > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : ""}>
              {activeIssues}
            </span>
            <span className="text-xs text-muted-foreground font-normal ml-1.5">
              {lang === "th" ? "ค้างอยู่" : "active"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {lang === "th" ? `ปลดบล็อกสำเร็จ ${resolvedIssues} จุด` : `Resolved: ${resolvedIssues} points`}
          </p>
        </div>
      </div>

      {/* 3. Total Man-Hours Logged */}
      <div className="p-4 rounded-xl border bg-card shadow-xs flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {lang === "th" ? "ชั่วโมงทำงานรวม" : "Logged Hours"}
          </span>
          <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-foreground">{totalHours} <span className="text-xs font-normal text-muted-foreground">ชม.</span></div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">
            {lang === "th" ? `จาก ${timeEntries.length} บันทึกงาน` : `Across ${timeEntries.length} logs`}
          </p>
        </div>
      </div>

      {/* 4. Permit Milestone Success */}
      <div className="p-4 rounded-xl border bg-card shadow-xs flex flex-col justify-between space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {lang === "th" ? "ใบขออนุญาต (Permits)" : "Permit Milestones"}
          </span>
          <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
            <FileCheck2 className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-foreground">
            {approvedPermits} <span className="text-xs text-muted-foreground font-normal">/ {permitTasks.length}</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
            {lang === "th" ? "อนุมัติเรียบร้อยแล้ว" : "Approved permits"}
          </p>
        </div>
      </div>

      {/* 5. Deliverables & Compression */}
      <div className="p-4 rounded-xl border bg-card shadow-xs flex flex-col justify-between space-y-2 col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {lang === "th" ? "ไฟล์ผลงาน & ประหยัดพื้นที่" : "Deliverables & Space"}
          </span>
          <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-600 flex items-center justify-center">
            <Zap className="h-4 w-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black text-foreground">{attachments.length} <span className="text-xs font-normal text-muted-foreground">ไฟล์</span></div>
          <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-0.5">
            {totalSavedPercent > 0 ? (lang === "th" ? `⚡ บีบอัดลดพื้นที่ ${totalSavedPercent}%` : `⚡ Saved ~${totalSavedPercent}% space`) : (lang === "th" ? "พร้อมส่งมอบ" : "Ready")}
          </p>
        </div>
      </div>
    </div>
  );
}
