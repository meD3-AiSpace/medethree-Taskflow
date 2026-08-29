"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Filter,
  Calendar,
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  RefreshCcw,
  X,
  AlertTriangle,
  ShieldAlert,
  Paperclip,
  UserCheck,
} from "lucide-react";
import {
  cn,
  formatDate,
  getCategoryLabel,
  getPriorityBadgeColor,
  getPriorityLabel,
  getStatusLabel,
} from "@/lib/utils";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { QuickLogIssueModal } from "@/components/tasks/quick-issue-modal";
import { QuickResolveModal } from "@/components/tasks/quick-resolve-modal";
import { QuickAttachModal } from "@/components/tasks/quick-attach-modal";
import { ViewModeSwitcher } from "@/components/tasks/view-mode-switcher";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

function TasksListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, projects, users, issues, currentUser, updateTaskDetails } = useTaskStore();
  const { t, lang } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [issueModalTask, setIssueModalTask] = useState<any>(null);
  const [resolveModalTask, setResolveModalTask] = useState<any>(null);
  const [attachModalTask, setAttachModalTask] = useState<any>(null);

  // URL Query Parameters
  const paramStatus = searchParams.get("status");
  const paramFilter = searchParams.get("filter");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSpecialFilter, setSelectedSpecialFilter] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "created_at">("deadline");
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

  // Sync from URL params on load or change
  useEffect(() => {
    if (paramFilter === "my_tasks") {
      setOnlyMyTasks(true);
      setSelectedSpecialFilter("all");
      setSelectedStatus("all");
    } else if (paramFilter === "overdue") {
      setSelectedSpecialFilter("overdue");
      setSelectedStatus("all");
    } else if (paramFilter === "issues") {
      setSelectedSpecialFilter("issues");
      setSelectedStatus("all");
    } else if (paramFilter === "at_risk") {
      setSelectedSpecialFilter("at_risk");
      setSelectedStatus("all");
    } else if (paramFilter === "stalled") {
      setSelectedSpecialFilter("stalled");
      setSelectedStatus("all");
    } else if (paramStatus) {
      setSelectedStatus(paramStatus);
      setSelectedSpecialFilter("all");
    } else {
      setSelectedSpecialFilter("all");
      setSelectedStatus("all");
    }
  }, [paramStatus, paramFilter]);

  const now = Date.now();

  // Filter & Sort logic
  const filteredTasks = tasks.filter((t) => {
    // 0. Only My Tasks Filter
    if (onlyMyTasks) {
      const isMine = t.assignees?.some((a) => a.id === currentUser.id);
      if (!isMine) return false;
    }

    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q) || (t.title_en && t.title_en.toLowerCase().includes(q));
      const matchDesc = t.description?.toLowerCase().includes(q) || (t.description_en && t.description_en.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc) return false;
    }

    // 2. Category Filter
    if (selectedCategory !== "all" && t.category !== selectedCategory) return false;

    // 3. Status Filter (Supports todo = todo + assigned)
    if (selectedStatus !== "all") {
      if (selectedStatus === "todo") {
        if (t.status !== "todo" && t.status !== "assigned") return false;
      } else if (t.status !== selectedStatus) {
        return false;
      }
    }

    // 4. Special Filter (Overdue, Issues, At-Risk, Stalled)
    if (selectedSpecialFilter === "overdue") {
      const isOverdue = t.deadline && new Date(t.deadline).getTime() < now && t.status !== "completed";
      if (!isOverdue) return false;
    } else if (selectedSpecialFilter === "issues") {
      const activeUnresolvedIssues = issues.filter(
        (i) => i.task_id === t.id && !i.is_resolved
      );
      if (activeUnresolvedIssues.length === 0) return false;
    } else if (selectedSpecialFilter === "at_risk") {
      const isAtRisk =
        t.deadline &&
        new Date(t.deadline).getTime() >= now &&
        new Date(t.deadline).getTime() - now < 3 * 86400000 &&
        t.status !== "completed";
      if (!isAtRisk) return false;
    } else if (selectedSpecialFilter === "stalled") {
      const isStalled =
        t.status !== "completed" &&
        now - new Date(t.updated_at || t.created_at).getTime() > 2 * 86400000;
      if (!isStalled) return false;
    }

    // 5. Priority Filter
    if (selectedPriority !== "all" && t.priority !== selectedPriority) return false;

    // 6. Project Filter
    if (selectedProject !== "all" && t.project_id !== selectedProject) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === "deadline") {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (sortBy === "priority") {
      const pWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
      return pWeights[b.priority] - pWeights[a.priority];
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const clearAllFilters = () => {
    setSelectedStatus("all");
    setSelectedSpecialFilter("all");
    setSelectedCategory("all");
    setSelectedPriority("all");
    setSelectedProject("all");
    setSearchQuery("");
  };

  const hasActiveFilter =
    selectedStatus !== "all" ||
    selectedSpecialFilter !== "all" ||
    selectedCategory !== "all" ||
    selectedPriority !== "all" ||
    selectedProject !== "all" ||
    searchQuery !== "";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("tasksTitle")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("tasksDesc")} ({t("showingTasks", { count: filteredTasks.length })})
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant={onlyMyTasks ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
            className={cn(
              "text-xs h-9 gap-1.5 font-semibold transition-all shadow-2xs",
              onlyMyTasks
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm"
                : "text-foreground hover:bg-accent"
            )}
          >
            <UserCheck className="h-4 w-4" />
            <span>{lang === "th" ? "🎯 งานของฉัน" : "My Tasks"}</span>
          </Button>

          <ViewModeSwitcher currentMode="list" />
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{t("createTaskBtn")}</span>
          </Button>
        </div>
      </div>

      {/* Active Filter Banner if navigated from Dashboard */}
      {selectedSpecialFilter !== "all" && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-semibold">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>
              {selectedSpecialFilter === "overdue" && (lang === "th" ? "กำลังกรอง: งานที่เกินกำหนดส่ง (Overdue Tasks)" : "Filtering: Overdue Tasks")}
              {selectedSpecialFilter === "issues" && (lang === "th" ? "กำลังกรอง: งานที่ติดปัญหา (Tasks with Active Blockers)" : "Filtering: Tasks with Blockers")}
              {selectedSpecialFilter === "at_risk" && (lang === "th" ? "กำลังกรอง: งานเสี่ยงล่าช้าใกล้ครบกำหนด (At-Risk Tasks)" : "Filtering: At-Risk Tasks")}
              {selectedSpecialFilter === "stalled" && (lang === "th" ? "กำลังกรอง: งานค้างไร้ความเคลื่อนไหว (Stalled Tasks)" : "Filtering: Stalled Tasks")}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs h-7 text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900 gap-1"
          >
            <X className="h-3 w-3" />
            <span>{lang === "th" ? "ล้างตัวกรอง" : "Clear Filter"}</span>
          </Button>
        </div>
      )}

      {selectedStatus !== "all" && selectedSpecialFilter === "all" && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <span>
              {lang === "th" ? `กำลังกรองตามสถานะ: ${getStatusLabel(selectedStatus as any, lang)}` : `Filtering by Status: ${getStatusLabel(selectedStatus as any, lang)}`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs h-7 text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900 gap-1"
          >
            <X className="h-3 w-3" />
            <span>{lang === "th" ? "ล้างตัวกรอง" : "Clear Filter"}</span>
          </Button>
        </div>
      )}

      {/* ⚡ One-Tap Fast Filter Chips (Mobile & Desktop Responsive) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => {
            clearAllFilters();
            setOnlyMyTasks(false);
          }}
          className={cn(
            "px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all border text-xs cursor-pointer flex items-center gap-1.5",
            !hasActiveFilter && !onlyMyTasks
              ? "bg-foreground text-background border-foreground shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:text-foreground border-border/80"
          )}
        >
          <span>{lang === "th" ? "ทั้งหมด" : "All"}</span>
          <span className="text-[10px] opacity-75 font-mono">({tasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setOnlyMyTasks(!onlyMyTasks)}
          className={cn(
            "px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all border text-xs cursor-pointer flex items-center gap-1.5",
            onlyMyTasks
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:text-foreground border-border/80"
          )}
        >
          <span>🎯 {lang === "th" ? "งานของฉัน" : "My Tasks"}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedSpecialFilter === "issues") {
              setSelectedSpecialFilter("all");
            } else {
              setSelectedSpecialFilter("issues");
              setSelectedStatus("all");
            }
          }}
          className={cn(
            "px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all border text-xs cursor-pointer flex items-center gap-1.5",
            selectedSpecialFilter === "issues"
              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
              : "bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
          )}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{lang === "th" ? "🚨 ติดปัญหา" : "Blockers"}</span>
          {issues.filter((i) => !i.is_resolved).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 text-[10px] font-bold">
              {issues.filter((i) => !i.is_resolved).length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedPriority === "urgent") {
              setSelectedPriority("all");
            } else {
              setSelectedPriority("urgent");
            }
          }}
          className={cn(
            "px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all border text-xs cursor-pointer flex items-center gap-1.5",
            selectedPriority === "urgent"
              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
              : "bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900"
          )}
        >
          <span>🔥 {lang === "th" ? "ด่วนที่สุด" : "Urgent"}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedSpecialFilter === "overdue") {
              setSelectedSpecialFilter("all");
            } else {
              setSelectedSpecialFilter("overdue");
              setSelectedStatus("all");
            }
          }}
          className={cn(
            "px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all border text-xs cursor-pointer flex items-center gap-1.5",
            selectedSpecialFilter === "overdue"
              ? "bg-purple-600 text-white border-purple-600 shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:text-foreground border-border/80"
          )}
        >
          <span>⏳ {lang === "th" ? "เกินกำหนด" : "Overdue"}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedStatus === "review") {
              setSelectedStatus("all");
            } else {
              setSelectedStatus("review");
              setSelectedSpecialFilter("all");
            }
          }}
          className={cn(
            "px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all border text-xs cursor-pointer flex items-center gap-1.5",
            selectedStatus === "review"
              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
              : "bg-muted/60 text-muted-foreground hover:text-foreground border-border/80"
          )}
        >
          <span>🔍 {lang === "th" ? "รอตรวจ (Review)" : "Review"}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>

          {/* Category Filter */}
          <div>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs h-9"
            >
              <option value="all">{t("allCategories")}</option>
              <option value="design">{t("catDesign")}</option>
              <option value="permit">{t("catPermit")}</option>
              <option value="site">{t("catSite")}</option>
              <option value="other">{t("catOther")}</option>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setSelectedSpecialFilter("all");
              }}
              className="text-xs h-9"
            >
              <option value="all">{t("allStatuses")}</option>
              <option value="todo">{t("stTodo")} / {t("stAssigned")}</option>
              <option value="in_progress">{t("stInProgress")}</option>
              <option value="review">{t("stReview")}</option>
              <option value="completed">{t("stCompleted")}</option>
            </Select>
          </div>

          {/* Priority Filter */}
          <div>
            <Select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs h-9"
            >
              <option value="all">{t("allPriorities")}</option>
              <option value="urgent">{t("pUrgent")}</option>
              <option value="high">{t("pHigh")}</option>
              <option value="medium">{t("pMedium")}</option>
              <option value="low">{t("pLow")}</option>
            </Select>
          </div>
        </div>

        {/* Sort and Project selection */}
        <div className="flex items-center justify-between text-xs pt-2 border-t flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("projectLabel")}</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="h-7 text-xs rounded border bg-background px-2"
            >
              <option value="all">{t("allProjects")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {getLocalizedDynamicText(p.name, p.name_en, lang)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs h-7 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                <span>{lang === "th" ? "รีเซ็ตตัวกรองทั้งหมด" : "Reset all"}</span>
              </Button>
            )}

            <span className="text-muted-foreground flex items-center gap-1 pl-2 border-l">
              <ArrowUpDown className="h-3 w-3" /> {t("sortByLabel")}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-7 text-xs rounded border bg-background px-2 font-medium"
            >
              <option value="deadline">{t("sortDeadline")}</option>
              <option value="priority">{t("sortPriority")}</option>
              <option value="created_at">{t("sortCreated")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain touch-pan-x smooth-scroll">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 font-semibold text-muted-foreground">
                <th className="py-3 px-4">{t("tableTitle")}</th>
                <th className="py-3 px-4">{t("tableProject")}</th>
                <th className="py-3 px-4">{t("tableStatus")}</th>
                <th className="py-3 px-4">{t("tablePriority")}</th>
                <th className="py-3 px-4">{t("tableAssignee")}</th>
                <th className="py-3 px-4">{t("tableDeadline")}</th>
                <th className="py-3 px-4 text-right">{t("tableActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    {t("noTasksFound")}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isOverdue =
                    task.deadline &&
                    new Date(task.deadline).getTime() < Date.now() &&
                    task.status !== "completed";
                  const taskIssues = issues.filter(
                    (i) => i.task_id === task.id
                  );
                  const activeUnresolvedIssues = taskIssues.filter((i) => !i.is_resolved);
                  const resolvedIssues = taskIssues.filter((i) => i.is_resolved);
                  const openIssues = activeUnresolvedIssues.length;
                  const lastResolved = resolvedIssues.length > 0 ? resolvedIssues[resolvedIssues.length - 1] : null;

                  const displayTitle = getLocalizedDynamicText(task.title, task.title_en, lang);
                  const rawProjectName = task.project?.name || "-";
                  const displayProject = getLocalizedDynamicText(rawProjectName, task.project?.name_en, lang);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => router.push(`/tasks/${task.id}`)}
                      className={`hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group border-b ${
                        isOverdue ? "bg-rose-50/20 dark:bg-rose-950/10" : ""
                      }`}
                    >
                      {/* Title & Issue Alert */}
                      <td className="py-3 px-4 font-medium">
                        <div className="space-y-1">
                          <span
                            className="font-semibold text-foreground group-hover:text-emerald-600 transition-colors block"
                          >
                            {displayTitle}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">
                                <AlertCircle className="h-3 w-3" />
                                {lang === "th" ? "เกินกำหนดส่ง" : "Overdue"}
                              </span>
                            )}
                            {openIssues > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200 text-[10px] font-bold animate-pulse">
                                <AlertTriangle className="h-3 w-3 text-rose-600" />
                                {lang === "th" ? `ติดปัญหา ${openIssues} รายการ` : `${openIssues} blockers`}
                              </span>
                            )}
                            {openIssues === 0 && lastResolved && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                {lang === "th"
                                  ? `แก้ปัญหาแล้ว (โดย: ${lastResolved.resolved_user?.full_name || "ทีมงาน"})`
                                  : `Resolved by ${lastResolved.resolved_user?.full_name || "Team"}`}
                              </span>
                            )}
                            {task.permit_details && task.permit_details.revision_round > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[10px]">
                                <RefreshCcw className="h-2.5 w-2.5" />
                                {lang === "th" ? `ตีกลับ ${task.permit_details.revision_round} รอบ` : `Rev: ${task.permit_details.revision_round}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Project & Category */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{displayProject}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {getCategoryLabel(task.category, lang)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            task.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : task.status === "in_progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : task.status === "review"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {getStatusLabel(task.status, lang)}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityBadgeColor(
                            task.priority
                          )}`}
                        >
                          {getPriorityLabel(task.priority, lang)}
                        </span>
                      </td>

                      {/* Assignees */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        {currentUser?.role === "admin" || currentUser?.role === "manager" ? (
                          <select
                            value={task.assignees?.[0]?.id || ""}
                            onChange={(e) => {
                              const newUserId = e.target.value;
                              const targetUser = users.find((u) => u.id === newUserId);
                              if (targetUser) {
                                updateTaskDetails(task.id, { assignees: [targetUser] });
                              }
                            }}
                            className="text-xs bg-muted/40 hover:bg-muted border border-border/60 hover:border-emerald-500 rounded px-2 py-1 text-foreground font-semibold cursor-pointer transition-colors max-w-[150px] truncate focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-background"
                            title={lang === "th" ? "คลิกเพื่อเปลี่ยนผู้รับผิดชอบ" : "Click to change assignee"}
                          >
                            {(!task.assignees || task.assignees.length === 0) && (
                              <option value="">{lang === "th" ? "- เลือกผู้รับผิดชอบ -" : "- Assign -"} </option>
                            )}
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {getLocalizedDynamicText(u.full_name, null, lang)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {task.assignees && task.assignees.length > 0 ? (
                              task.assignees.map((a) => {
                                const aName = getLocalizedDynamicText(a.full_name, null, lang) || (lang === "th" ? "สมาชิก" : "Member");
                                return (
                                  <div key={a.id} className="flex items-center gap-1" title={aName}>
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-[9px] bg-emerald-100 text-emerald-800 font-bold">
                                        {aName.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate max-w-[100px] text-[11px]">
                                      {aName}
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-muted-foreground/60 italic text-[11px]">-</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Deadline */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-medium ${
                            isOverdue
                              ? "text-rose-600 font-bold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatDate(task.deadline, lang)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAttachModalTask(task);
                            }}
                            className="text-[11px] h-7 px-2 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 gap-1 font-semibold cursor-pointer"
                            title={lang === "th" ? "แนบไฟล์ผลงาน / แบบแปลน" : "Attach deliverable files"}
                          >
                            <Paperclip className="h-3 w-3 text-emerald-600" />
                            <span>{lang === "th" ? "แนบไฟล์" : "Attach"}</span>
                          </Button>

                          {/* Quick Resolve Blocker Button (if has active issue) */}
                          {openIssues > 0 ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setResolveModalTask(task);
                              }}
                              className="text-[11px] h-7 px-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 gap-1 font-bold cursor-pointer shadow-xs"
                              title={lang === "th" ? "บันทึกการแก้ไขปัญหาติดขัด" : "Resolve active blocker"}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>{lang === "th" ? "✅ แก้ปัญหาแล้ว" : "Resolve"}</span>
                            </Button>
                          ) : (
                            /* Quick Log Blocker Button (if no active issue) */
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIssueModalTask(task);
                              }}
                              className="text-[11px] h-7 px-2 border-rose-400/60 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 gap-1 font-semibold cursor-pointer"
                              title={lang === "th" ? "บันทึกปัญหาที่พบ / จุดติดขัด" : "Log blocker issue"}
                            >
                              <ShieldAlert className="h-3 w-3 text-rose-600" />
                              <span>{lang === "th" ? "+ บันทึกปัญหา" : "+ Issue"}</span>
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/tasks/${task.id}`);
                            }}
                            className="text-xs h-7 px-2 text-foreground group-hover:bg-emerald-600 group-hover:text-white transition-colors cursor-pointer"
                          >
                            {t("viewDetails")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
        />
      )}

      {/* Quick Log Issue Modal */}
      {issueModalTask && (
        <QuickLogIssueModal
          task={issueModalTask}
          open={Boolean(issueModalTask)}
          onOpenChange={(open) => {
            if (!open) setIssueModalTask(null);
          }}
        />
      )}

      {/* Quick Resolve Blocker Modal */}
      {resolveModalTask && (
        <QuickResolveModal
          task={resolveModalTask}
          open={Boolean(resolveModalTask)}
          onOpenChange={(open) => {
            if (!open) setResolveModalTask(null);
          }}
        />
      )}

      {/* Quick Attach Deliverable Modal */}
      {attachModalTask && (
        <QuickAttachModal
          task={attachModalTask}
          open={Boolean(attachModalTask)}
          onOpenChange={(open) => {
            if (!open) setAttachModalTask(null);
          }}
        />
      )}
    </div>
  );
}

export default function TasksListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading tasks...</div>}>
      <TasksListContent />
    </Suspense>
  );
}
