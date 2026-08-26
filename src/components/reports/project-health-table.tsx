"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Project, Task, TaskIssue, TimeEntry } from "@/lib/types/database.types";
import { Language } from "@/lib/i18n/translations";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";
import { Building2, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

interface ProjectHealthTableProps {
  projects: Project[];
  tasks: Task[];
  issues: TaskIssue[];
  timeEntries: TimeEntry[];
  lang: Language;
}

export function ProjectHealthTable({
  projects,
  tasks,
  issues,
  timeEntries,
  lang,
}: ProjectHealthTableProps) {
  const router = useRouter();
  // Build aggregated project statistics
  const projectStats = projects.map((project) => {
    const projTasks = tasks.filter((t) => t.project_id === project.id);
    const total = projTasks.length;
    const completed = projTasks.filter((t) => t.status === "completed").length;
    const inProgress = projTasks.filter((t) => t.status === "in_progress" || t.status === "review").length;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const taskIds = projTasks.map((t) => t.id);
    const projActiveIssues = issues.filter((i) => taskIds.includes(i.task_id) && !i.is_resolved).length;

    const projMinutes = timeEntries
      .filter((e) => taskIds.includes(e.task_id))
      .reduce((acc, e) => acc + (e.duration_minutes || 0), 0);
    const projHours = (projMinutes / 60).toFixed(1);

    const displayName = getLocalizedDynamicText(project.name, project.name_en, lang);

    return {
      id: project.id,
      name: displayName,
      total,
      completed,
      inProgress,
      progressPercent,
      activeIssues: projActiveIssues,
      hours: projHours,
    };
  });

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden space-y-0">
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-foreground">
            {lang === "th" ? "สถานะความคืบหน้ารายโครงการ (Project Health Breakdown)" : "Project Health & Progress"}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {lang === "th" ? `ทั้งหมด ${projects.length} โครงการ` : `${projects.length} projects`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
            <tr>
              <th className="py-2.5 px-4">{lang === "th" ? "ชื่อโครงการ" : "Project Name"}</th>
              <th className="py-2.5 px-4 text-center">{lang === "th" ? "งานทั้งหมด" : "Tasks"}</th>
              <th className="py-2.5 px-4 text-center">{lang === "th" ? "ปิดงานแล้ว" : "Completed"}</th>
              <th className="py-2.5 px-4">{lang === "th" ? "ความคืบหน้า (%)" : "Progress (%)"}</th>
              <th className="py-2.5 px-4 text-center">{lang === "th" ? "จุดติดขัด" : "Blockers"}</th>
              <th className="py-2.5 px-4 text-right">{lang === "th" ? "ชั่วโมงทำงาน" : "Logged Hours"}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projectStats.map((p) => (
              <tr
                key={p.id}
                onClick={() => router.push(`/tasks?project=${p.id}`)}
                className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group"
              >
                <td className="py-3 px-4 font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                  {p.name}
                </td>
                <td className="py-3 px-4 text-center text-muted-foreground">{p.total}</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">{p.completed}</td>
                <td className="py-3 px-4 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${p.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold w-9 text-right">{p.progressPercent}%</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  {p.activeIssues > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px] animate-urgent-badge">
                      <AlertTriangle className="h-3 w-3 text-rose-600" />
                      <span>{p.activeIssues}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-medium text-[11px]">✓ ปกติ</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-medium text-muted-foreground">
                  {p.hours} ชม.
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
