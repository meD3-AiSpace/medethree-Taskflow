"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  FileCheck2,
  Users,
  ShieldAlert,
  ArrowRight,
  Plus,
  ArrowUpRight,
  Flame,
  FileSpreadsheet,
} from "lucide-react";
import { formatDate, getPriorityBadgeColor, getPriorityLabel, getStatusLabel } from "@/lib/utils";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

export default function DashboardPage() {
  const { tasks, issues, users, teams } = useTaskStore();
  const { t, lang } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Status Metrics
  const todoCount = tasks.filter((t) => t.status === "todo" || t.status === "assigned").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const reviewCount = tasks.filter((t) => t.status === "review").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const now = Date.now();
  const overdueTasks = tasks.filter(
    (t) => t.deadline && new Date(t.deadline).getTime() < now && t.status !== "completed"
  );
  const atRiskTasks = tasks.filter(
    (t) =>
      t.deadline &&
      new Date(t.deadline).getTime() >= now &&
      new Date(t.deadline).getTime() - now < 3 * 86400000 &&
      t.status !== "completed"
  );

  // Stalled Tasks (no update > 2 days and not completed)
  const stalledTasks = tasks.filter(
    (t) =>
      t.status !== "completed" &&
      now - new Date(t.updated_at || t.created_at).getTime() > 2 * 86400000
  );

  // Section 3.7: Tasks with Unresolved Issues (Blockers)
  const unresolvedIssues = issues.filter((i) => !i.is_resolved);
  const tasksWithBlockers = tasks.filter((t) =>
    unresolvedIssues.some((issue) => issue.task_id === t.id)
  );

  // Workload per User
  const userWorkload = users.map((user) => {
    const userTasks = tasks.filter(
      (t) => t.assignees?.some((a) => a.id === user.id) && t.status !== "completed"
    );
    const urgentCount = userTasks.filter((t) => t.priority === "urgent" || t.priority === "high").length;
    return {
      user,
      taskCount: userTasks.length,
      urgentCount,
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("dashboardTitle")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("dashboardDesc")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/reports">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8.5 gap-1.5 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold shadow-2xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>{lang === "th" ? "📊 รายงานสรุปผู้บริหาร" : "Executive Report"}</span>
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8.5 gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{t("createTaskBtn")}</span>
          </Button>
        </div>
      </div>

      {/* 1. Status KPI Metric Cards (Interactive Clickable Links to Tasks) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: To Do / Assigned */}
        <Link href="/tasks?status=todo" className="block group">
          <Card className="border-l-4 border-l-slate-400 bg-card hover:bg-slate-50/60 dark:hover:bg-slate-900/40 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>{t("kpiTodo")}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-foreground mt-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {todoCount}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-2 flex items-center justify-between">
                <span>{t("kpiTodoSub")}</span>
                <span className="text-[9px] text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {lang === "th" ? "ดูรายการงาน →" : "View tasks →"}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: In Progress */}
        <Link href="/tasks?status=in_progress" className="block group">
          <Card className="border-l-4 border-l-blue-500 bg-card hover:bg-blue-50/40 dark:hover:bg-blue-950/30 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <span>{t("kpiInProgress")}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {inProgressCount}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-2 flex items-center justify-between">
                <span>{t("kpiInProgressSub")}</span>
                <span className="text-[9px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {lang === "th" ? "ดูรายการงาน →" : "View tasks →"}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: In Review */}
        <Link href="/tasks?status=review" className="block group">
          <Card className="border-l-4 border-l-amber-500 bg-card hover:bg-amber-50/40 dark:hover:bg-amber-950/30 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <span>{t("kpiReview")}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {reviewCount}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-2 flex items-center justify-between">
                <span>{t("kpiReviewSub")}</span>
                <span className="text-[9px] text-amber-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {lang === "th" ? "ดูรายการงาน →" : "View tasks →"}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 4: Completed */}
        <Link href="/tasks?status=completed" className="block group">
          <Card className="border-l-4 border-l-emerald-500 bg-card hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>{t("kpiCompleted")}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {completedCount}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-2 flex items-center justify-between">
                <span>{t("kpiCompletedSub")}</span>
                <span className="text-[9px] text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {lang === "th" ? "ดูรายการงาน →" : "View tasks →"}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 5: Overdue (Pulsing Blinking Urgent Alert) */}
        <Link href="/tasks?filter=overdue" className="block group">
          <Card className={`border-l-4 border-l-rose-500 bg-rose-50/40 dark:bg-rose-950/40 hover:bg-rose-100/60 dark:hover:bg-rose-900/50 hover:shadow-md transition-all cursor-pointer h-full border-rose-200 dark:border-rose-800 ${overdueTasks.length > 0 ? "animate-urgent-badge" : ""}`}>
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className={`h-4 w-4 shrink-0 text-rose-600 ${overdueTasks.length > 0 ? "animate-urgent-dot" : ""}`} />
                    <span className={overdueTasks.length > 0 ? "animate-urgent-text" : ""}>{t("kpiOverdue")}</span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-rose-600" />
                </div>
                <div className={`text-2xl font-black mt-1 ${overdueTasks.length > 0 ? "animate-urgent-text text-rose-600" : "text-rose-600"}`}>
                  {overdueTasks.length}
                </div>
              </div>
              <div className="text-[10px] text-rose-700 dark:text-rose-300 mt-2 flex items-center justify-between font-semibold">
                <span className={overdueTasks.length > 0 ? "animate-urgent-text" : ""}>{t("kpiOverdueSub")}</span>
                <span className="text-[9px] text-rose-700 font-bold underline">
                  {lang === "th" ? "ดูงานเกินกำหนด →" : "View overdue →"}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 2. Main Dashboard Grid: Issues / Blockers vs At Risk vs Stalled */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 3.7: Dedicated Widget "งานที่ติดปัญหาอยู่" */}
        <Card className={`border-rose-200 dark:border-rose-900/60 shadow-sm bg-gradient-to-b from-rose-50/40 to-transparent ${unresolvedIssues.length > 0 ? "ring-1 ring-rose-400/40" : ""}`}>
          <CardHeader className="p-4 pb-3 border-b border-rose-100 dark:border-rose-950 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className={`h-4 w-4 text-rose-600 ${unresolvedIssues.length > 0 ? "animate-urgent-dot" : ""}`} />
              <CardTitle className={`text-xs font-bold ${unresolvedIssues.length > 0 ? "text-rose-700 animate-urgent-text" : "text-rose-800"}`}>
                {t("widgetIssuesTitle")} ({unresolvedIssues.length})
              </CardTitle>
            </div>
            <Link href="/tasks?filter=issues">
              <Badge variant="urgent" className={`text-[10px] px-2 py-0.5 cursor-pointer ${unresolvedIssues.length > 0 ? "animate-urgent-badge" : ""}`}>
                {t("widgetIssuesBadge")} →
              </Badge>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {tasksWithBlockers.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                <span>{t("widgetIssuesEmpty")}</span>
              </div>
            ) : (
              tasksWithBlockers.map((task) => {
                const taskOpenIssues = issues.filter((i) => i.task_id === task.id && !i.is_resolved);
                const firstIssue = taskOpenIssues[0];
                const displayTitle = getLocalizedDynamicText(task.title, task.title_en, lang);
                const displayIssueDesc = getLocalizedDynamicText(
                  firstIssue?.issue_description || "มีข้อติดขัดที่ต้องประสานงาน",
                  firstIssue?.issue_description_en,
                  lang
                );

                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}?tab=support`}
                    className="block p-3 rounded-lg border border-rose-300 dark:border-rose-800 bg-background/90 hover:bg-rose-50/60 transition-all text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-foreground truncate">{displayTitle}</span>
                      <span className="text-[10px] text-rose-600 font-black shrink-0 animate-urgent-text flex items-center gap-0.5">
                        <Flame className="h-3 w-3 inline text-rose-600" />
                        {taskOpenIssues.length} {lang === "th" ? "ปัญหา" : "Issues"}
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-800 dark:text-rose-300 line-clamp-2 bg-rose-50 dark:bg-rose-950/50 p-1.5 rounded border border-rose-200/60 font-medium">
                      ⚠️ {displayIssueDesc}
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* At-Risk Tasks Widget (Near Deadline) */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-xs font-bold">
                {t("widgetAtRiskTitle")} ({atRiskTasks.length})
              </CardTitle>
            </div>
            <Link href="/tasks?filter=at_risk">
              <span className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer">{t("widgetAtRiskBadge")} →</span>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {atRiskTasks.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                <span>{t("widgetAtRiskEmpty")}</span>
              </div>
            ) : (
              atRiskTasks.map((task) => {
                const displayTitle = getLocalizedDynamicText(task.title, task.title_en, lang);
                const rawProjectName = task.project?.name || "-";
                const displayProject = getLocalizedDynamicText(rawProjectName, task.project?.name_en, lang);

                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-accent transition-all text-xs"
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-foreground truncate">{displayTitle}</div>
                      <div className="text-[10px] text-muted-foreground">{displayProject}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-amber-600 font-semibold block">
                        {formatDate(task.deadline, lang)}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {task.assignees?.[0]?.full_name || (lang === "th" ? "ไม่มีผู้รับผิดชอบ" : "Unassigned")}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Stalled Tasks Widget (No Activity > 2 Days) */}
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-xs font-bold">
                {t("widgetStalledTitle")} ({stalledTasks.length})
              </CardTitle>
            </div>
            <Link href="/tasks?filter=stalled">
              <span className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer">{t("widgetStalledBadge")} →</span>
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {stalledTasks.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                <span>{t("widgetStalledEmpty")}</span>
              </div>
            ) : (
              stalledTasks.slice(0, 5).map((task) => {
                const displayTitle = getLocalizedDynamicText(task.title, task.title_en, lang);
                return (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-accent transition-all text-xs"
                  >
                    <div className="truncate pr-2">
                      <div className="font-medium text-foreground truncate">{displayTitle}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {t("tableStatus")}: {getStatusLabel(task.status, lang)}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      {t("viewTask")}
                    </span>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Team Workload Distribution (Workload per user) */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-xs font-bold">
              {t("widgetWorkloadTitle")}
            </CardTitle>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {t("widgetWorkloadSub")}
          </span>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {userWorkload.map(({ user, taskCount, urgentCount }) => {
              const maxTasks = 5;
              const percent = Math.min(100, (taskCount / maxTasks) * 100);
              const isOverloaded = taskCount >= 4;

              return (
                <Link
                  key={user.id}
                  href={`/tasks?assignee=${user.id}`}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-md hover:border-emerald-500/50 block group ${
                    isOverloaded
                      ? "border-amber-300 bg-amber-50/30 dark:bg-amber-950/20"
                      : "border-border bg-card hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-xs text-foreground group-hover:text-emerald-600 transition-colors truncate">
                      {user.full_name}
                    </div>
                    <Badge variant={user.role === "manager" ? "high" : "default"} className="text-[9px] uppercase">
                      {user.role}
                    </Badge>
                  </div>

                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{t("tasksHolding")}</span>
                    <strong className="text-foreground text-sm font-bold">
                      {taskCount} <span className="text-[11px] font-normal text-muted-foreground">{lang === "th" ? "งาน" : "tasks"}</span>
                    </strong>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverloaded
                          ? "bg-amber-500"
                          : taskCount === 0
                          ? "bg-muted"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                    <span>{t("urgentTasks")}</span>
                    <span className={urgentCount > 0 ? "font-black text-rose-600 animate-urgent-text" : ""}>
                      {urgentCount} {lang === "th" ? "งาน" : "tasks"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
        />
      )}
    </div>
  );
}
