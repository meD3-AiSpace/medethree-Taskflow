"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { UserProfile, Task, TimeEntry } from "@/lib/types/database.types";
import { Language } from "@/lib/i18n/translations";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, CheckCircle2, Clock } from "lucide-react";

interface TeamWorkloadTableProps {
  users: UserProfile[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  lang: Language;
}

export function TeamWorkloadTable({
  users,
  tasks,
  timeEntries,
  lang,
}: TeamWorkloadTableProps) {
  const router = useRouter();
  const memberStats = users.map((user) => {
    // Tasks assigned to this user
    const assignedTasks = tasks.filter((t) =>
      t.assignees?.some((a) => a.id === user.id)
    );
    const completedTasks = assignedTasks.filter((t) => t.status === "completed").length;
    const activeTasks = assignedTasks.filter(
      (t) => t.status === "in_progress" || t.status === "assigned" || t.status === "review"
    ).length;

    // Time logged by this user
    const userMinutes = timeEntries
      .filter((e) => e.user_id === user.id)
      .reduce((acc, e) => acc + (e.duration_minutes || 0), 0);
    const userHours = (userMinutes / 60).toFixed(1);

    return {
      id: user.id,
      name: user.full_name,
      role: user.role,
      assignedCount: assignedTasks.length,
      completedCount: completedTasks,
      activeCount: activeTasks,
      hours: userHours,
    };
  });

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden space-y-0">
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-foreground">
            {lang === "th" ? "การกระจายภาระงานและผลงานรายบุคคล (Team Output & Workload)" : "Team Workload & Output"}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {lang === "th" ? `สมาชิก ${users.length} ท่าน` : `${users.length} members`}
        </span>
      </div>

      <div className="overflow-x-auto overscroll-x-contain touch-pan-x smooth-scroll">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
            <tr>
              <th className="py-2.5 px-4">{lang === "th" ? "ชื่อ-นามสกุล / ตำแหน่ง" : "Member & Role"}</th>
              <th className="py-2.5 px-4 text-center">{lang === "th" ? "งานที่ถืออยู่ (Active)" : "Active Tasks"}</th>
              <th className="py-2.5 px-4 text-center">{lang === "th" ? "ปิดงานแล้ว" : "Completed"}</th>
              <th className="py-2.5 px-4 text-right">{lang === "th" ? "ชั่วโมงทำงานที่บันทึก" : "Logged Hours"}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {memberStats.map((m) => (
              <tr
                key={m.id}
                onClick={() => router.push(`/tasks?assignee=${m.id}`)}
                className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] font-bold">
                        {(m?.name || "?").trim().charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground">{getLocalizedDynamicText(m.name, null, lang)}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{m.role}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                      m.activeCount > 4
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {m.activeCount} {lang === "th" ? "งาน" : "tasks"}
                  </span>
                </td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">
                  {m.completedCount}
                </td>
                <td className="py-3 px-4 text-right font-medium text-foreground">
                  {m.hours} {lang === "th" ? "ชม." : "hrs"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
