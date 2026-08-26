"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { ViewModeSwitcher } from "@/components/tasks/view-mode-switcher";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Filter,
  AlertCircle,
  FileCheck2,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  formatDate,
  getPriorityBadgeColor,
  getPriorityLabel,
  getStatusLabel,
} from "@/lib/utils";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";
import { Task, TaskPriority, TaskCategory } from "@/lib/types/database.types";

export default function CalendarPage() {
  const { tasks, projects, users } = useTaskStore();
  const { t, lang } = useLanguage();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState<"month" | "week">("month");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Previous Month & Next Month Days for clean grid
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedProject !== "all" && t.project_id !== selectedProject) return false;
    if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
    if (selectedPriority !== "all" && t.priority !== selectedPriority) return false;
    return true;
  });

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate: { [dateStr: string]: Task[] } = {};
  filteredTasks.forEach((task) => {
    if (task.deadline) {
      const d = new Date(task.deadline);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push(task);
    }
  });

  const monthNamesTh = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthTitle = lang === "th" ? `${monthNamesTh[month]} ${year + 543}` : `${monthNamesEn[month]} ${year}`;

  const weekDayHeaders = lang === "th" 
    ? ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const openCreateForDate = (dateStr: string) => {
    setPrefilledDate(dateStr);
    setShowCreateModal(true);
  };

  // Build Month Grid Days
  const calendarCells = [];

  // Previous month filler days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const prevDayNum = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, prevDayNum);
    const dateKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(
      prevDayNum
    ).padStart(2, "0")}`;
    calendarCells.push({
      dayNum: prevDayNum,
      isCurrentMonth: false,
      dateKey,
      dateObj: prevDate,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarCells.push({
      dayNum: d,
      isCurrentMonth: true,
      dateKey,
      dateObj: curDate,
    });
  }

  // Next month filler days to complete 35 or 42 grid
  const remainingCells = 35 - calendarCells.length;
  const nextMonthFillerCount = remainingCells >= 0 ? remainingCells : 42 - calendarCells.length;
  for (let n = 1; n <= nextMonthFillerCount; n++) {
    const nextDate = new Date(year, month + 1, n);
    const dateKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(
      n
    ).padStart(2, "0")}`;
    calendarCells.push({
      dayNum: n,
      isCurrentMonth: false,
      dateKey,
      dateObj: nextDate,
    });
  }

  const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(
    new Date().getDate()
  ).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-emerald-600" />
            <span>{lang === "th" ? "ปฏิทินติดตามงาน & กำหนดส่ง" : "Task Deadlines & Schedule Calendar"}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === "th"
              ? "ดูภาพรวมกำหนดส่งมอบงาน (Deadlines) ทั้งหมด เพื่อป้องกันการจัดสรรงานทับซ้อนและงานล่าช้า"
              : "Comprehensive overview of task deadlines across all projects to prevent workload clashes"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 3-View Mode Switcher */}
          <ViewModeSwitcher currentMode="calendar" />

          {/* Create Task Button */}
          <Button
            size="sm"
            onClick={() => {
              setPrefilledDate(undefined);
              setShowCreateModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{t("createTaskBtn")}</span>
          </Button>
        </div>
      </div>

      {/* Filter and Month Navigation Bar */}
      <div className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[160px] text-center font-bold text-sm text-foreground">
              {monthTitle}
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs h-8 ml-1">
              {lang === "th" ? "วันนี้" : "Today"}
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="h-8 text-xs rounded-lg border bg-background px-2.5 font-medium"
            >
              <option value="all">{t("allProjects")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {getLocalizedDynamicText(p.name, p.name_en, lang)}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 text-xs rounded-lg border bg-background px-2.5 font-medium"
            >
              <option value="all">{t("allCategories")}</option>
              <option value="design">{t("catDesign")}</option>
              <option value="permit">{t("catPermit")}</option>
              <option value="site">{t("catSite")}</option>
              <option value="other">{t("catOther")}</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-8 text-xs rounded-lg border bg-background px-2.5 font-medium"
            >
              <option value="all">{t("allPriorities")}</option>
              <option value="urgent">{t("pUrgent")}</option>
              <option value="high">{t("pHigh")}</option>
              <option value="medium">{t("pMedium")}</option>
              <option value="low">{t("pLow")}</option>
            </select>
          </div>
        </div>

        {/* Priority Legend */}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-2 border-t flex-wrap">
          <span className="font-semibold text-foreground">{lang === "th" ? "ระดับความสำคัญ:" : "Priority:"}</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-urgent-dot" />
            <span className="text-rose-600 font-bold">{t("pUrgent")}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>{t("pHigh")}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span>{t("pMedium")}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            <span>{t("pLow")}</span>
          </span>
        </div>
      </div>

      {/* Month Calendar Grid */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b bg-muted/40 text-center font-semibold text-xs py-2.5 text-muted-foreground">
          {weekDayHeaders.map((header, idx) => (
            <div key={idx} className={idx === 0 || idx === 6 ? "text-rose-600/80 font-bold" : ""}>
              {header}
            </div>
          ))}
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y border-b text-xs">
          {calendarCells.map((cell, idx) => {
            const isToday = cell.dateKey === todayKey;
            const dayTasks = tasksByDate[cell.dateKey] || [];

            return (
              <div
                key={idx}
                onClick={() => openCreateForDate(cell.dateKey)}
                className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors group relative cursor-pointer ${
                  cell.isCurrentMonth ? "bg-card hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20" : "bg-muted/15 text-muted-foreground/50"
                } ${isToday ? "ring-2 ring-inset ring-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20" : ""}`}
              >
                {/* Cell Header: Day Number + Quick Add */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center h-6 w-6 rounded-full font-bold text-xs ${
                      isToday
                        ? "bg-emerald-600 text-white shadow-xs"
                        : cell.isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {/* Always Available Add Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreateForDate(cell.dateKey);
                    }}
                    className="h-5 w-5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-2xs group-hover:scale-110"
                    title={lang === "th" ? `+ เพิ่มงานในวันที่ ${cell.dayNum}` : `+ Add task on day ${cell.dayNum}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Task Badges on this Day */}
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                  {dayTasks.map((task) => {
                    const isOverdue =
                      task.deadline &&
                      new Date(task.deadline).getTime() < Date.now() &&
                      task.status !== "completed";
                    const isUrgent = task.priority === "urgent";
                    const isPermit = task.category === "permit";
                    const displayTitle = getLocalizedDynamicText(task.title, task.title_en, lang);

                    let priorityBg = "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200";
                    if (isUrgent || isOverdue) {
                      priorityBg = "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 font-bold";
                    } else if (task.priority === "high") {
                      priorityBg = "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200";
                    } else if (task.priority === "medium") {
                      priorityBg = "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200";
                    }

                    return (
                      <Link
                        key={task.id}
                        href={`/tasks/${task.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`block px-2 py-1 rounded border text-[10px] leading-tight truncate transition-all hover:scale-[1.02] hover:shadow-xs ${priorityBg} ${
                          isUrgent ? "animate-urgent-badge" : ""
                        }`}
                        title={`${task.title} (${getStatusLabel(task.status, lang)})`}
                      >
                        <div className="flex items-center gap-1">
                          {isPermit ? (
                            <FileCheck2 className="h-2.5 w-2.5 shrink-0 text-emerald-600" />
                          ) : (
                            <span
                              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                isUrgent ? "bg-rose-600 animate-urgent-dot" : "bg-current"
                              }`}
                            />
                          )}
                          <span className="truncate font-semibold">{displayTitle}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          initialDeadline={prefilledDate}
        />
      )}
    </div>
  );
}
