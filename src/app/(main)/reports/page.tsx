"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { ExecutiveKPICards } from "@/components/reports/executive-kpi-cards";
import { AIExecutiveBriefing } from "@/components/reports/ai-executive-briefing";
import { ProjectHealthTable } from "@/components/reports/project-health-table";
import { TeamWorkloadTable } from "@/components/reports/team-workload-table";
import { exportTasksToCSV } from "@/lib/utils/export-csv";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";
import { formatDate, formatDateTime, getCategoryLabel, getPriorityBadgeColor, getPriorityLabel, getStatusLabel } from "@/lib/utils";
import {
  FileSpreadsheet,
  Printer,
  Smartphone,
  Calendar,
  Filter,
  CheckCircle2,
  Building2,
  Share2,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";

type TimeRangePreset = "this_week" | "last_week" | "this_month" | "last_month" | "custom";

export default function ExecutiveReportsPage() {
  const router = useRouter();
  const { tasks, projects, users, issues, timeEntries, attachments, currentUser } = useTaskStore();
  const { t, lang } = useLanguage();

  const [timeRange, setTimeRange] = useState<TimeRangePreset>("this_week");
  const [selectedProject, setSelectedProject] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isSendingLine, setIsSendingLine] = useState(false);
  const [lineSuccess, setLineSuccess] = useState(false);

  // Compute Start & End Date based on preset
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let label = "";

    if (timeRange === "this_week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      label = lang === "th" ? `สัปดาห์นี้ (${formatDate(start.toISOString(), lang)} - ${formatDate(end.toISOString(), lang)})` : `This Week (${formatDate(start.toISOString(), lang)} - ${formatDate(end.toISOString(), lang)})`;
    } else if (timeRange === "last_week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      label = lang === "th" ? `สัปดาห์ที่แล้ว (${formatDate(start.toISOString(), lang)} - ${formatDate(end.toISOString(), lang)})` : `Last Week (${formatDate(start.toISOString(), lang)} - ${formatDate(end.toISOString(), lang)})`;
    } else if (timeRange === "this_month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      label = lang === "th" ? `ประจำเดือนนี้ (${formatDate(start.toISOString(), lang)} - ${formatDate(end.toISOString(), lang)})` : `This Month (${formatDate(start.toISOString(), lang)} - ${formatDate(end.toISOString(), lang)})`;
    } else if (timeRange === "last_month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = lang === "th" ? `ประจำเดือนที่แล้ว (${formatDate(start.toISOString(), lang)} - ${formatDate(end.toISOString(), lang)})` : `Last Month (${formatDate(start.toISOString(), lang)} - ${formatDate(end.toISOString(), lang)})`;
    } else {
      start = customStartDate ? new Date(customStartDate) : new Date(2020, 0, 1);
      end = customEndDate ? new Date(customEndDate) : new Date();
      label = lang === "th" ? `ช่วงวันที่ ${formatDate(start.toISOString(), lang)} ถึง ${formatDate(end.toISOString(), lang)}` : `${formatDate(start.toISOString(), lang)} to ${formatDate(end.toISOString(), lang)}`;
    }

    return { startDate: start, endDate: end, periodLabel: label };
  }, [timeRange, customStartDate, customEndDate, lang]);

  // Filter Tasks by Date & Project
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedProject !== "all" && t.project_id !== selectedProject) return false;
      return true;
    });
  }, [tasks, selectedProject]);

  const filteredIssues = useMemo(() => {
    const taskIds = filteredTasks.map((t) => t.id);
    return issues.filter((i) => taskIds.includes(i.task_id));
  }, [issues, filteredTasks]);

  const filteredTimeEntries = useMemo(() => {
    const taskIds = filteredTasks.map((t) => t.id);
    return timeEntries.filter((e) => taskIds.includes(e.task_id));
  }, [timeEntries, filteredTasks]);

  const filteredAttachments = useMemo(() => {
    const taskIds = filteredTasks.map((t) => t.id);
    return attachments.filter((a) => taskIds.includes(a.task_id));
  }, [attachments, filteredTasks]);

  // Export CSV Action
  const handleExportCSV = () => {
    exportTasksToCSV(
      filteredTasks,
      filteredTimeEntries,
      filteredIssues,
      `MedTree_Executive_Report_${timeRange}`,
      lang
    );
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Send Executive Briefing to LINE OA
  const handleSendToLine = async () => {
    setIsSendingLine(true);
    setLineSuccess(false);

    try {
      const completedCount = filteredTasks.filter((t) => t.status === "completed").length;
      const activeBlockers = filteredIssues.filter((i) => !i.is_resolved).length;
      const totalHours = (
        filteredTimeEntries.reduce((acc, t) => acc + (t.duration_minutes || 0), 0) / 60
      ).toFixed(1);

      const targetUserId =
        currentUser.line_user_id ||
        (typeof window !== "undefined" ? localStorage.getItem("taskflow_line_user_id") : null) ||
        "Ud03173af920035ad7d808a0feb10327d";

      const targetToken =
        (typeof window !== "undefined"
          ? localStorage.getItem("taskflow_line_channel_access_token")
          : null) ||
        "8OBUXdfTk10sKwL/o1KvCTbx0C4TbUA/q+q2/Fb9jniS8AQCKmO/jUvxioGUflsM2iLIDricYT5Qt7H8EfjrUbiLncPUXbueDD0rjnjGu8xuiJ01r0w55V0SBHdaogsMTivcHwHxw71UmjhXjFIVHAdB04t89/1O/w1cDnyilFU=";

      const res = await fetch("/api/line/test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId: targetUserId,
          channelAccessToken: targetToken,
          title: lang === "th" ? `📊 สรุปผลงานผู้บริหาร (${periodLabel})` : `📊 Executive Report (${periodLabel})`,
          message:
            lang === "th"
              ? `✅ ปิดงานสำเร็จ: ${completedCount} / ${filteredTasks.length} รายการ\n⚠️ ปัญหาติดขัด: ${activeBlockers} จุด\n⏱️ ชั่วโมงทำงานจริง: ${totalHours} ชม.`
              : `✅ Completed Tasks: ${completedCount} / ${filteredTasks.length}\n⚠️ Active Blockers: ${activeBlockers}\n⏱️ Logged Hours: ${totalHours} hrs`,
        }),
      });

      if (res.ok) {
        setLineSuccess(true);
        setTimeout(() => setLineSuccess(false), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingLine(false);
    }
  };

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Printable Executive Header (Shown only on Print) */}
      <div className="hidden print:block border-b-2 border-emerald-800 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-emerald-950">MedTree Design & Build</h1>
            <p className="text-xs text-muted-foreground">Executive Performance & Project Progress Report</p>
          </div>
          <div className="text-right text-xs">
            <div><strong>{lang === "th" ? "รอบรายงาน:" : "Period:"}</strong> {periodLabel}</div>
            <div><strong>{lang === "th" ? "พิมพ์เมื่อ:" : "Printed on:"}</strong> {formatDateTime(new Date().toISOString(), lang)}</div>
            <div><strong>{lang === "th" ? "ผู้ออกรายงาน:" : "Generated by:"}</strong> {getLocalizedDynamicText(currentUser.full_name, null, lang)} ({currentUser.role.toUpperCase()})</div>
          </div>
        </div>
      </div>

      {/* Screen Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {lang === "th" ? "ศูนย์รายงานสรุปผู้บริหาร (Executive Dashboard Report)" : "Executive Reports & Analytics"}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === "th"
              ? "ส่งออกรายงานสรุปผลการดำเนินงานประจำสัปดาห์ / ประจำเดือน พร้อมบทวิเคราะห์ AI และรูปแบบพิมพ์ A4"
              : "Generate and export weekly, monthly, and executive briefings with AI analysis and A4 print layout."}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Print / Save PDF Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs h-8.5 gap-1.5 shadow-2xs"
          >
            <Printer className="h-4 w-4 text-muted-foreground" />
            <span>{lang === "th" ? "🖨️ พิมพ์ / บันทึก PDF" : "Print / PDF"}</span>
          </Button>

          {/* Export to Excel / CSV */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs h-8.5 gap-1.5 border-emerald-500/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>{lang === "th" ? "📊 ดาวน์โหลด Excel (CSV)" : "Export CSV"}</span>
          </Button>

          {/* Send Executive Summary to LINE OA */}
          <Button
            type="button"
            size="sm"
            onClick={handleSendToLine}
            disabled={isSendingLine}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8.5 gap-1.5 shadow-xs font-semibold"
          >
            <Smartphone className="h-4 w-4" />
            <span>
              {isSendingLine
                ? lang === "th"
                  ? "กำลังส่งเข้า LINE..."
                  : "Sending..."
                : lineSuccess
                ? lang === "th"
                  ? "✓ ส่งเข้า LINE สำเร็จ!"
                  : "✓ Sent to LINE!"
                : lang === "th"
                ? "📱 ส่งสรุปเข้า LINE OA"
                : "Push to LINE"}
            </span>
          </Button>
        </div>
      </div>

      {/* Filter and Period Selection Bar */}
      <div className="p-4 rounded-xl border bg-card shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground mr-1">
              {lang === "th" ? "ช่วงเวลารายงาน:" : "Period:"}
            </span>

            <Button
              type="button"
              variant={timeRange === "this_week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("this_week")}
              className={`text-xs h-8 ${timeRange === "this_week" ? "bg-emerald-600 text-white" : ""}`}
            >
              {lang === "th" ? "📅 สัปดาห์นี้" : "This Week"}
            </Button>

            <Button
              type="button"
              variant={timeRange === "last_week" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("last_week")}
              className={`text-xs h-8 ${timeRange === "last_week" ? "bg-emerald-600 text-white" : ""}`}
            >
              {lang === "th" ? "📅 สัปดาห์ก่อน" : "Last Week"}
            </Button>

            <Button
              type="button"
              variant={timeRange === "this_month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("this_month")}
              className={`text-xs h-8 ${timeRange === "this_month" ? "bg-emerald-600 text-white" : ""}`}
            >
              {lang === "th" ? "🗓️ ประจำเดือนนี้" : "This Month"}
            </Button>

            <Button
              type="button"
              variant={timeRange === "last_month" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("last_month")}
              className={`text-xs h-8 ${timeRange === "last_month" ? "bg-emerald-600 text-white" : ""}`}
            >
              {lang === "th" ? "🗓️ ประจำเดือนที่แล้ว" : "Last Month"}
            </Button>

            <Button
              type="button"
              variant={timeRange === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("custom")}
              className={`text-xs h-8 ${timeRange === "custom" ? "bg-emerald-600 text-white" : ""}`}
            >
              {lang === "th" ? "📆 กำหนดเอง" : "Custom Range"}
            </Button>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              {lang === "th" ? "โครงการ:" : "Project:"}
            </span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="h-8 text-xs rounded-lg border bg-background px-2.5 font-medium min-w-[180px]"
            >
              <option value="all">{lang === "th" ? "🏢 ทุกโครงการ (All Projects)" : "🏢 All Projects"}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {getLocalizedDynamicText(p.name, p.name_en, lang)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Inputs (If custom selected) */}
        {timeRange === "custom" && (
          <div className="flex items-center gap-3 pt-2 border-t text-xs">
            <div className="flex items-center gap-1.5">
              <span>{lang === "th" ? "ตั้งแต่วันที่:" : "From:"}</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-7 text-xs rounded border px-2 bg-background"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>{lang === "th" ? "ถึงวันที่:" : "To:"}</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-7 text-xs rounded border px-2 bg-background"
              />
            </div>
          </div>
        )}
      </div>

      {/* 1. Executive KPI Summary Cards */}
      <ExecutiveKPICards
        tasks={filteredTasks}
        timeEntries={filteredTimeEntries}
        issues={filteredIssues}
        attachments={filteredAttachments}
        lang={lang}
      />

      {/* 2. AI Executive Briefing Engine (Gemini AI) */}
      <AIExecutiveBriefing
        tasks={filteredTasks}
        issues={filteredIssues}
        timeEntries={filteredTimeEntries}
        periodLabel={periodLabel}
        lang={lang}
      />

      {/* 3. Project Health Breakdown & Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectHealthTable
          projects={projects}
          tasks={filteredTasks}
          issues={filteredIssues}
          timeEntries={filteredTimeEntries}
          lang={lang}
        />

        <TeamWorkloadTable
          users={users}
          tasks={filteredTasks}
          timeEntries={filteredTimeEntries}
          lang={lang}
        />
      </div>

      {/* 4. Detailed Tasks Table for this Report Period */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-foreground">
              {lang === "th" ? `รายการงานทั้งหมดในรอบรายงาน (${filteredTasks.length} รายการ)` : `All Tasks in Report (${filteredTasks.length})`}
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {periodLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
              <tr>
                <th className="py-2.5 px-4">{lang === "th" ? "ชื่องาน" : "Title"}</th>
                <th className="py-2.5 px-4">{lang === "th" ? "โครงการ" : "Project"}</th>
                <th className="py-2.5 px-4">{lang === "th" ? "หมวดหมู่" : "Category"}</th>
                <th className="py-2.5 px-4">{lang === "th" ? "สถานะ" : "Status"}</th>
                <th className="py-2.5 px-4">{lang === "th" ? "ความสำคัญ" : "Priority"}</th>
                <th className="py-2.5 px-4">{lang === "th" ? "ผู้รับผิดชอบ" : "Assignees"}</th>
                <th className="py-2.5 px-4 text-right">{lang === "th" ? "กำหนดส่ง" : "Deadline"}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTasks.map((t) => {
                const displayTitle = getLocalizedDynamicText(t.title, t.title_en, lang);
                const displayProject = getLocalizedDynamicText(t.project?.name || "", t.project?.name_en, lang);

                return (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/tasks/${t.id}`)}
                    className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-semibold text-foreground group-hover:text-emerald-600 transition-colors">{displayTitle}</td>
                    <td className="py-3 px-4 text-muted-foreground">{displayProject}</td>
                    <td className="py-3 px-4">{getCategoryLabel(t.category, lang)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          t.status === "completed"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : t.status === "in_progress"
                            ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {getStatusLabel(t.status, lang)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getPriorityBadgeColor(
                          t.priority
                        )}`}
                      >
                        {getPriorityLabel(t.priority, lang)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {t.assignees?.map((a) => getLocalizedDynamicText(a.full_name, null, lang)).join(", ") || "-"}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-foreground">
                      {formatDate(t.deadline, lang)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Sign-off Footer (Shown only on Print) */}
      <div className="hidden print:flex items-center justify-between pt-12 text-xs break-inside-avoid">
        <div className="text-center space-y-8">
          <div>ลงชื่อ ............................................................</div>
          <div className="font-semibold text-slate-800">( ผู้จัดทำรายงาน / Project Manager )</div>
        </div>
        <div className="text-center space-y-8">
          <div>ลงชื่อ ............................................................</div>
          <div className="font-semibold text-slate-800">( หัวหน้าวิศวกร / Lead Architect )</div>
        </div>
        <div className="text-center space-y-8">
          <div>ลงชื่อ ............................................................</div>
          <div className="font-semibold text-slate-800">( ผู้บริหารและที่ปรึกษา / Managing Director )</div>
        </div>
      </div>
    </div>
  );
}
