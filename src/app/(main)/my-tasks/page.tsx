"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ListTodo,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { formatDate, getPriorityBadgeColor, getPriorityLabel, getStatusLabel } from "@/lib/utils";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

export default function MyTasksPage() {
  const { tasks, currentUser, updateTaskStatus } = useTaskStore();
  const { t, lang } = useLanguage();
  const [filterStatus, setFilterStatus] = useState<"active" | "completed">("active");

  // Tasks assigned to current logged-in user
  const myTasks = tasks.filter((t) =>
    t.assignees?.some((a) => a.id === currentUser.id)
  );

  const activeTasks = myTasks.filter((t) => t.status !== "completed");
  const completedTasks = myTasks.filter((t) => t.status === "completed");

  const displayedTasks = filterStatus === "active" ? activeTasks : completedTasks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <ListTodo className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t("myTasksTitle")}</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("myTasksSub")} ({currentUser.full_name})
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center rounded-lg border bg-card p-1 text-xs">
          <button
            type="button"
            onClick={() => setFilterStatus("active")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              filterStatus === "active"
                ? "bg-emerald-600 text-white font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("tabActive")} ({activeTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("completed")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              filterStatus === "completed"
                ? "bg-emerald-600 text-white font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("tabCompleted")} ({completedTasks.length})
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {displayedTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center bg-card">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-foreground">{t("noMyTasks")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filterStatus === "active"
                ? (lang === "th" ? "คุณจัดการงานที่ได้รับมอบหมายเสร็จสิ้นทั้งหมดแล้ว" : "You have completed all active assigned tasks!")
                : (lang === "th" ? "ยังไม่มีงานที่ปิดเสร็จสิ้น" : "No completed tasks yet")}
            </p>
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isOverdue =
              task.deadline &&
              new Date(task.deadline).getTime() < Date.now() &&
              task.status !== "completed";
            const openIssues = task.unresolved_issues_count || 0;

            const displayTitle = getLocalizedDynamicText(task.title, task.title_en, lang);
            const rawProjectName = task.project?.name || (lang === "th" ? "โครงการทั่วไป" : "General Project");
            const displayProject = getLocalizedDynamicText(rawProjectName, task.project?.name_en, lang);

            return (
              <div
                key={task.id}
                className="p-4 rounded-xl border bg-card hover:border-emerald-500/50 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                {/* Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {displayProject}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getPriorityBadgeColor(
                        task.priority
                      )}`}
                    >
                      {getPriorityLabel(task.priority, lang)}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                      {getStatusLabel(task.status, lang)}
                    </span>
                  </div>

                  <Link
                    href={`/tasks/${task.id}`}
                    className="font-bold text-sm text-foreground hover:text-emerald-600 transition-colors block truncate"
                  >
                    {displayTitle}
                  </Link>

                  {/* Issues */}
                  {openIssues > 0 && (
                    <div className="flex items-center gap-1.5 text-rose-600 font-semibold text-[11px]">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>
                        {lang === "th" ? `ติดปัญหา ${openIssues} รายการที่ต้องแก้ไข` : `${openIssues} active blockers to resolve`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right side: Deadline & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                  <div className="text-left sm:text-right text-[11px]">
                    <span className="text-muted-foreground block text-[10px]">{t("deadline")}</span>
                    <strong className={isOverdue ? "text-rose-600 font-bold" : "text-foreground"}>
                      {formatDate(task.deadline, lang)}
                    </strong>
                  </div>

                  {/* Quick Action: Start Task */}
                  {task.status === "assigned" && (
                    <Button
                      size="sm"
                      onClick={() => updateTaskStatus(task.id, "in_progress")}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                    >
                      {t("startNow")}
                    </Button>
                  )}

                  <Link href={`/tasks/${task.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                      <span>{t("openTask")}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
