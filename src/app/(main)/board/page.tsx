"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Task, TaskStatus } from "@/lib/types/database.types";
import { TaskCard } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Plus, ListFilter, AlertCircle, CheckCircle2 } from "lucide-react";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { ViewModeSwitcher } from "@/components/tasks/view-mode-switcher";

export default function KanbanBoardPage() {
  const { tasks, updateTaskStatus, projects } = useTaskStore();
  const { t, lang } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Column definitions
  const columns: Array<{ status: TaskStatus; title: string; color: string; badgeColor: string }> = [
    { status: "todo", title: t("kpiTodo"), color: "border-t-slate-400", badgeColor: "bg-slate-100 text-slate-700" },
    { status: "assigned", title: t("stAssigned"), color: "border-t-purple-500", badgeColor: "bg-purple-100 text-purple-700" },
    { status: "in_progress", title: t("kpiInProgress"), color: "border-t-blue-500", badgeColor: "bg-blue-100 text-blue-700" },
    { status: "review", title: t("kpiReview"), color: "border-t-amber-500", badgeColor: "bg-amber-100 text-amber-700" },
    { status: "completed", title: t("kpiCompleted"), color: "border-t-emerald-500", badgeColor: "bg-emerald-100 text-emerald-700" },
  ];

  const filteredTasks = tasks.filter((t) => {
    if (selectedProject !== "all" && t.project_id !== selectedProject) return false;
    if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
    return true;
  });

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTaskId(task.id);
    e.dataTransfer.setData("text/plain", task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const res = updateTaskStatus(taskId, targetStatus);
    if (!res.success) {
      setErrorMessage(res.message || (lang === "th" ? "ไม่สามารถย้ายการ์ดได้ตามกฎ Workflow" : "State transition not allowed by Workflow rules"));
    } else {
      setSuccessMessage(lang === "th" ? "อัปเดตสถานะงานและบันทึกลง Activity Log เรียบร้อย" : "Status updated and logged to Activity Log");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("boardTitle")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("boardDesc")}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <ViewModeSwitcher currentMode="board" />
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

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between p-3 rounded-xl border bg-card shadow-sm flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">{t("projectLabel")}</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="h-8 text-xs rounded-md border bg-background px-2.5"
            >
              <option value="all">{t("allProjects")}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">{t("allCategories")}:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 text-xs rounded-md border bg-background px-2.5"
            >
              <option value="all">{t("allCategories")}</option>
              <option value="design">{t("catDesign")}</option>
              <option value="permit">{t("catPermit")}</option>
              <option value="structure">{t("catStructure")}</option>
              <option value="mep">{t("catMep")}</option>
              <option value="interior">{t("catInterior")}</option>
              <option value="landscape">{t("catLandscape")}</option>
              <option value="inspection">{t("catInspection")}</option>
              <option value="site">{t("catSite")}</option>
              <option value="other">{t("catOther")}</option>
            </select>
          </div>
        </div>

        <span className="text-muted-foreground text-[11px]">
          {t("showingTasks", { count: filteredTasks.length })}
        </span>
      </div>

      {/* Error / Success Notifications */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{t("validationFailed")} </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start min-h-[600px]">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.status);
          return (
            <div
              key={col.status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`rounded-xl border bg-card/70 p-3 shadow-sm border-t-4 ${col.color} min-h-[500px] flex flex-col`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b">
                <h3 className="text-xs font-bold text-foreground">{col.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List in Column */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed rounded-lg border-border/60 flex items-center justify-center text-muted-foreground/50 text-[11px]">
                    {t("dropHere")}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDragStart={handleDragStart}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

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
