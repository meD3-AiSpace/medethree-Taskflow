"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { PermitDetails, PermitStatus, Task } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FileCheck2,
  Building2,
  Calendar,
  RefreshCcw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

export default function PermitTrackingPage() {
  const router = useRouter();
  const { tasks, updatePermitStatus } = useTaskStore();
  const { t, lang } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const permitTasks = safeTasks.filter((t) => t && t.category === "permit" && t.permit_details);

  const permitColumns: Array<{
    status: PermitStatus;
    title: string;
    icon: React.ElementType;
    color: string;
    badgeColor: string;
  }> = [
    {
      status: "preparing",
      title: t("pstPreparing"),
      icon: FileCheck2,
      color: "border-t-slate-400",
      badgeColor: "bg-slate-100 text-slate-700",
    },
    {
      status: "submitted",
      title: t("pstSubmitted"),
      icon: Building2,
      color: "border-t-blue-500",
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      status: "under_review",
      title: t("pstUnderReview"),
      icon: Calendar,
      color: "border-t-amber-500",
      badgeColor: "bg-amber-100 text-amber-700",
    },
    {
      status: "needs_revision",
      title: t("pstNeedsRevision"),
      icon: AlertTriangle,
      color: "border-t-rose-500 bg-rose-50/10",
      badgeColor: "bg-rose-100 text-rose-700 font-bold",
    },
    {
      status: "approved",
      title: t("pstApproved"),
      icon: CheckCircle2,
      color: "border-t-emerald-500",
      badgeColor: "bg-emerald-100 text-emerald-700",
    },
    {
      status: "rejected",
      title: t("pstRejected"),
      icon: XCircle,
      color: "border-t-red-500",
      badgeColor: "bg-red-100 text-red-700",
    },
  ];

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (!task) return;
    setDraggedTaskId(task.id);
    e.dataTransfer.setData("text/plain", task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: PermitStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId) return;
    updatePermitStatus(taskId, targetStatus);
    setDraggedTaskId(null);
  };

  const handleQuickStatusChange = (e: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>, taskId: string, newStatus: PermitStatus) => {
    e.stopPropagation();
    updatePermitStatus(taskId, newStatus);
  };

  const getNextStage = (currentStatus: PermitStatus): { status: PermitStatus; label: string; icon: any } | null => {
    switch (currentStatus) {
      case "preparing":
        return { status: "submitted", label: lang === "th" ? "ยื่นเรื่อง" : "Submit", icon: Building2 };
      case "submitted":
        return { status: "under_review", label: lang === "th" ? "รอพิจารณา" : "In Review", icon: Calendar };
      case "under_review":
        return { status: "approved", label: lang === "th" ? "อนุมัติ" : "Approve", icon: CheckCircle2 };
      case "needs_revision":
        return { status: "submitted", label: lang === "th" ? "ยื่นรอบใหม่" : "Resubmit", icon: RefreshCcw };
      case "rejected":
        return { status: "preparing", label: lang === "th" ? "เตรียมใหม่" : "Prepare", icon: RefreshCcw };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {t("permitTitle")}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("permitSub")}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{lang === "th" ? "เพิ่มใบขออนุญาต" : "Add Permit Task"}</span>
        </Button>
      </div>

      {/* Info Banner */}
      <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
          <RefreshCcw className="h-4 w-4 shrink-0" />
          <span>{t("autoRevisionNotice")}</span>
        </div>
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
          {lang === "th" ? `ทั้งหมด ${permitTasks.length} รายการ` : `Total: ${permitTasks.length} permits`}
        </span>
      </div>

      {/* Permit Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-start min-h-[600px]">
        {permitColumns.map((col) => {
          const colPermits = permitTasks.filter(
            (t) => t.permit_details?.permit_status === col.status
          );
          const Icon = col.icon;

          return (
            <div
              key={col.status}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`rounded-xl border bg-card/70 p-3 shadow-sm border-t-4 ${col.color} min-h-[480px] flex flex-col`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{col.title}</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${col.badgeColor}`}>
                  {colPermits.length}
                </span>
              </div>

              {/* Permits List */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colPermits.length === 0 ? (
                  <div className="h-28 border-2 border-dashed rounded-lg border-border/50 flex items-center justify-center text-muted-foreground/40 text-[10px]">
                    {lang === "th" ? "ว่าง" : "Empty"}
                  </div>
                ) : (
                  colPermits.map((task) => {
                    if (!task) return null;
                    const permit: Partial<PermitDetails> = task.permit_details || {};
                    const displayTitle = getLocalizedDynamicText(task.title || "ใบขออนุญาต", task.title_en, lang);
                    const displayType = getLocalizedDynamicText(permit.permit_type || "ใบอนุญาต", permit.permit_type_en, lang);
                    const displayAuth = getLocalizedDynamicText(permit.authority || "สำนักงานเขต", permit.authority_en, lang);
                    const rawProjectName = task.project?.name || "-";
                    const displayProject = getLocalizedDynamicText(rawProjectName, task.project?.name_en, lang);

                    const firstAssignee = task.assignees?.[0];
                    const assigneeName = firstAssignee?.full_name || "";
                    const assigneeInitial = assigneeName.trim().charAt(0).toUpperCase() || "?";
                    const revisionCount = permit.revision_round || 0;
                    const nextStage = getNextStage((permit.permit_status || "preparing") as PermitStatus);
                    const NextIcon = nextStage?.icon || Building2;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onClick={() => router.push(`/tasks/${task.id}`)}
                        className="group rounded-xl border bg-card p-3 shadow-xs hover:shadow-md transition-all cursor-pointer border-border hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 space-y-2 text-xs touch-pan-y"
                      >
                        {/* Type & Revision badge */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded truncate">
                            {displayType}
                          </span>
                          {revisionCount > 0 && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shrink-0">
                              <RefreshCcw className="h-2.5 w-2.5" />
                              {lang === "th" ? `แก้ ${revisionCount} รอบ` : `Rev ${revisionCount}`}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <span
                          className="font-semibold text-foreground group-hover:text-emerald-600 transition-colors block line-clamp-2 leading-snug"
                        >
                          {displayTitle}
                        </span>

                        {/* Authority info */}
                        <div className="p-2 rounded bg-muted/40 text-[11px] space-y-0.5">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{displayAuth || (lang === "th" ? "สำนักงานเขต" : "Authority")}</span>
                          </div>
                          {permit.target_approval_date && (
                            <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>{lang === "th" ? "คาดว่า: " : "Target: "}{formatDate(permit.target_approval_date, lang)}</span>
                            </div>
                          )}
                        </div>

                        {/* Mobile & iPad 1-Tap Quick Move & Next Stage Action */}
                        <div
                          className="pt-1.5 pb-0.5 flex flex-col gap-1.5 border-t"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between gap-1">
                            {/* Quick Move Dropdown */}
                            <select
                              value={permit.permit_status || "preparing"}
                              onChange={(e) => handleQuickStatusChange(e, task.id, e.target.value as PermitStatus)}
                              className="w-full text-[10px] h-6 px-1.5 rounded bg-muted/70 hover:bg-muted font-medium border border-border/80 text-foreground cursor-pointer focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="preparing">📝 {t("pstPreparing")}</option>
                              <option value="submitted">🏢 {t("pstSubmitted")}</option>
                              <option value="under_review">⏳ {t("pstUnderReview")}</option>
                              <option value="needs_revision">⚠️ {t("pstNeedsRevision")}</option>
                              <option value="approved">✅ {t("pstApproved")}</option>
                              <option value="rejected">❌ {t("pstRejected")}</option>
                            </select>

                            {/* 1-Tap Next Stage Button */}
                            {nextStage && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleQuickStatusChange(e, task.id, nextStage.status)}
                                className="h-6 px-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white shrink-0 gap-1 cursor-pointer"
                                title={lang === "th" ? `ย้ายไป: ${nextStage.label}` : `Move to: ${nextStage.label}`}
                              >
                                <NextIcon className="h-2.5 w-2.5" />
                                <span>{nextStage.label}</span>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Footer: Assignee & Project */}
                        <div className="flex items-center justify-between pt-1 border-t text-[10px] text-muted-foreground">
                          <span className="truncate max-w-[120px]">{displayProject}</span>
                          {firstAssignee && (
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarFallback className="text-[8px]">
                                {assigneeInitial}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTaskModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          defaultCategory="permit"
        />
      )}
    </div>
  );
}
