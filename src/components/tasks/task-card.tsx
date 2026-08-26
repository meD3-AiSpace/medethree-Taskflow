"use client";

import React from "react";
import Link from "next/link";
import { Task } from "@/lib/types/database.types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  Calendar,
  AlertCircle,
  MessageSquare,
  FileCheck2,
  Clock,
  RefreshCcw,
} from "lucide-react";
import {
  formatDate,
  getCategoryLabel,
  getPriorityBadgeColor,
  getPriorityLabel,
} from "@/lib/utils";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

interface TaskCardProps {
  task: Task;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

export function TaskCard({ task, onDragStart }: TaskCardProps) {
  const { lang, t } = useLanguage();
  const isOverdue = task.deadline && new Date(task.deadline).getTime() < Date.now() && task.status !== "completed";
  const isDueSoon =
    task.deadline &&
    !isOverdue &&
    new Date(task.deadline).getTime() - Date.now() < 2 * 86400000 &&
    task.status !== "completed";

  const unresolvedIssues = task.unresolved_issues_count || 0;

  const displayTitle = getLocalizedDynamicText(task.title, task.title_en, lang);
  const rawProjectName = task.project?.name || (lang === "th" ? "โครงการทั่วไป" : "General Project");
  const displayProject = getLocalizedDynamicText(rawProjectName, task.project?.name_en, lang);

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart && onDragStart(e, task)}
      className={`group relative rounded-xl border bg-card p-3.5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing border-border/80 hover:border-emerald-500/50 flex flex-col justify-between gap-2.5 ${
        unresolvedIssues > 0 ? "border-rose-300 dark:border-rose-800/80" : ""
      }`}
    >
      {/* Top Header: Category & Priority */}
      <div className="flex items-center justify-between gap-1 text-[11px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-muted-foreground/90 truncate max-w-[120px]">
            {displayProject}
          </span>
          {task.category === "permit" && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold text-[10px]">
              <FileCheck2 className="h-3 w-3" />
              {lang === "th" ? "ใบขออนุญาต" : "Permit"}
            </span>
          )}
        </div>
        <span
          className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getPriorityBadgeColor(
            task.priority
          )} ${task.priority === "urgent" ? "animate-urgent-badge" : ""}`}
        >
          {getPriorityLabel(task.priority, lang)}
        </span>
      </div>

      {/* Task Title Link */}
      <Link
        href={`/tasks/${task.id}`}
        className="text-xs font-semibold text-foreground hover:text-emerald-600 transition-colors line-clamp-2 leading-relaxed"
      >
        {displayTitle}
      </Link>

      {/* Section 3.7: Blocker / Issue Alert Tag (Pulsing Red Urgent Alert) */}
      {unresolvedIssues > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-rose-100/80 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-[10px] text-rose-800 dark:text-rose-200 font-bold animate-urgent-badge">
          <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 animate-urgent-dot" />
          <span className="animate-urgent-text">
            {lang === "th" ? `ติดปัญหา ${unresolvedIssues} รายการ` : `${unresolvedIssues} active blockers`}
          </span>
        </div>
      )}

      {/* Section 3.8: Permit Revision Round Badge if any */}
      {task.permit_details && task.permit_details.revision_round > 0 && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[10px] text-amber-800 dark:text-amber-300 font-medium">
          <RefreshCcw className="h-2.5 w-2.5 text-amber-600" />
          <span>
            {lang === "th" ? `ตีกลับแก้ไขแล้ว ${task.permit_details.revision_round} รอบ` : `Revision round: ${task.permit_details.revision_round}`}
          </span>
        </div>
      )}

      {/* Bottom Footer: Assignees & Deadline */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
        {/* Deadline Indicator */}
        <div
          className={`flex items-center gap-1 font-medium ${
            isOverdue
              ? "text-rose-600 dark:text-rose-400 font-black animate-urgent-text"
              : isDueSoon
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
          }`}
        >
          <Calendar className={`h-3.5 w-3.5 ${isOverdue ? "text-rose-600 animate-urgent-dot" : ""}`} />
          <span>{formatDate(task.deadline, lang)}</span>
        </div>

        {/* Assignee Avatar */}
        <div className="flex items-center -space-x-1.5">
          {task.assignees && task.assignees.length > 0 ? (
            task.assignees.map((assignee) => (
              <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-[9px]">
                  {assignee.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground/60 italic">
              {lang === "th" ? "ยังไม่มอบหมาย" : "Unassigned"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
