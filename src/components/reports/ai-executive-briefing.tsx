"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Task, TaskIssue, TimeEntry } from "@/lib/types/database.types";
import { Sparkles, Trophy, AlertTriangle, Target, RefreshCw, Copy, Check } from "lucide-react";
import { Language } from "@/lib/i18n/translations";
import { useTaskStore } from "@/lib/store/task-store";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

interface AIExecutiveBriefingProps {
  tasks: Task[];
  issues: TaskIssue[];
  timeEntries: TimeEntry[];
  periodLabel: string;
  lang: Language;
}

export function AIExecutiveBriefing({
  tasks,
  issues,
  timeEntries,
  periodLabel,
  lang,
}: AIExecutiveBriefingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Completed & Active tasks summary
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const activeIssues = issues.filter((i) => !i.is_resolved);
  const totalMinutes = timeEntries.reduce((acc, t) => acc + (t.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Helper to generate default structured briefing in active language (100% Grounded on Real Data)
  const generateDefaultBriefing = useCallback((currentLang: Language) => {
    if (tasks.length === 0) {
      if (currentLang === "en") {
        return {
          achievements: [
            `No tasks or deliverables recorded in this reporting period (${periodLabel}).`,
            `Zero work hours logged in the system for this timeframe.`,
          ],
          risks: [
            "No active blockers or operational clashes reported.",
            "Project progress tracking is currently inactive due to zero registered tasks.",
          ],
          nextSteps: [
            "Click '+ Create Task' above to register project milestones and assign team members.",
            "Define clear deadlines and allocate responsibilities across active projects.",
            "Log working hours (Time Log) and attach blueprints/deliverables as work begins.",
          ],
        };
      }

      return {
        achievements: [
          `ยังไม่มีรายการงานที่สร้างหรือบันทึกในรอบรายงานนี้ (${periodLabel})`,
          `ยังไม่พบชั่วโมงทำงานที่ถูกบันทึกในระบบสำหรับช่วงเวลานี้`,
        ],
        risks: [
          "ไม่มีรายงานปัญหาติดขัดหรือข้อติดขัดในระบบ",
          "ระบบยังไม่สามารถประเมินอัตราความคืบหน้าได้เนื่องจากยังไม่มีรายการงานในรอบเวลานี้",
        ],
        nextSteps: [
          "กดปุ่ม '+ สร้างงานใหม่' ด้านบน เพื่อเริ่มต้นกำหนดงานและมอบหมายผู้รับผิดชอบ",
          "กำหนดวันส่งมอบงาน (Deadline) และจัดสรรบุคลากรในแต่ละโครงการ",
          "เมื่อเริ่มปฏิบัติงานจริง ให้ทีมงานบันทึกเวลาทำงาน (Time Log) และอัปโหลดแบบเพื่อประเมินผล",
        ],
      };
    }

    if (currentLang === "en") {
      const topDoneTitles = completedTasks
        .slice(0, 2)
        .map((t) => getLocalizedDynamicText(t.title, t.title_en, "en"))
        .join('", "');

      const topIssues = activeIssues
        .slice(0, 2)
        .map((i) => `"${getLocalizedDynamicText(i.issue_description, i.issue_description_en, "en")}"`)
        .join(", ");

      return {
        achievements: [
          completedTasks.length > 0
            ? `Successfully delivered ${completedTasks.length} of ${tasks.length} tasks (overall progress: ${completionRate}%).`
            : `Currently executing ${tasks.length} active tasks (0 tasks completed yet).`,
          completedTasks.length > 0
            ? `Key completed deliverables: "${topDoneTitles}".`
            : `Team actively advancing ${tasks.length - completedTasks.length} tasks in progress.`,
          `Team logged ${totalHours} man-hours of dedicated work in this period.`,
        ],
        risks:
          activeIssues.length > 0
            ? [
                `Detected ${activeIssues.length} active blockers requiring urgent resolution: ${topIssues}.`,
                "Unresolved blockers should be reviewed promptly to prevent milestone delays.",
              ]
            : [
                "Zero critical blockers currently obstructing project execution.",
                "Maintain close tracking on near-deadline tasks to guarantee on-time delivery.",
              ],
        nextSteps: [
          activeIssues.length > 0
            ? "Coordinate with relevant engineers/architects to unblock active blockers."
            : "Continue monitoring active task milestones toward scheduled delivery dates.",
          "Prepare upcoming deliverable packages for supervisor QA/QC review.",
          "Keep logging work hours and attaching updated project drawings.",
        ],
      };
    }

    // Thai Default
    const topDoneTitlesTh = completedTasks
      .slice(0, 2)
      .map((t) => getLocalizedDynamicText(t.title, t.title_en, "th"))
      .join('", "');

    const topIssuesTh = activeIssues
      .slice(0, 2)
      .map((i) => `"${getLocalizedDynamicText(i.issue_description, i.issue_description_en, "th")}"`)
      .join(", ");

    return {
      achievements: [
        completedTasks.length > 0
          ? `ปิดงานสำเร็จตามเป้าหมายจำนวน ${completedTasks.length} / ${tasks.length} รายการ (คิดเป็นความคืบหน้า ${completionRate}%)`
          : `กำลังดำเนินงานอยู่ ${tasks.length} รายการ (ยังไม่มีงานที่ปิดสมบูรณ์ในรอบนี้)`,
        completedTasks.length > 0
          ? `งานสำคัญที่ส่งมอบเรียบร้อย: "${topDoneTitlesTh}"`
          : `ทีมงานกำลังขับเคลื่อนงานที่กำลังดำเนินการจำนวน ${tasks.length - completedTasks.length} รายการ`,
        `ทีมงานบันทึกเวลาปฏิบัติงานจริงรวม ${totalHours} ชั่วโมง ในรอบเวลานี้`,
      ],
      risks:
        activeIssues.length > 0
          ? [
              `พบจุดติดขัดที่ต้องประสานงานแก้ไขเร่งด่วน ${activeIssues.length} รายการ: ${topIssuesTh}`,
              "ควรเร่งปลดล็อกปัญหาติดขัดเพื่อป้องกันผลกระทบต่อกำหนดส่งมอบงาน",
            ]
          : [
              "ไม่มีจุดติดขัดรุนแรงที่ขัดขวางโครงการในขณะนี้",
              "ควรเฝ้าระวังงานที่ใกล้ถึงกำหนดส่ง (Due Soon) เพื่อรักษาระดับ On-time Delivery ให้สมบูรณ์",
            ],
      nextSteps: [
        activeIssues.length > 0
          ? "ประสานงานกับทีมงานผู้รับผิดชอบเพื่อเร่งแก้ไขประเด็นติดขัดที่ระบุไว้"
          : "ติดตามความคืบหน้าของงานที่กำลังดำเนินการให้เป็นไปตามกำหนดส่ง",
        "เตรียมชุดเอกสารส่งมอบงวดถัดไป และตรวจสอบแบบก่อนส่งตรวจรับ (Review)",
        "บันทึกชั่วโมงทำงานและอัปโหลดไฟล์ผลงานอย่างต่อเนื่อง",
      ],
    };
  }, [tasks.length, completedTasks, activeIssues, completionRate, totalHours, periodLabel]);

  const [briefing, setBriefing] = useState<{
    achievements: string[];
    risks: string[];
    nextSteps: string[];
  }>(() => generateDefaultBriefing(lang));

  // Automatically update briefing when language changes
  useEffect(() => {
    setBriefing(generateDefaultBriefing(lang));
  }, [lang, generateDefaultBriefing]);

  const handleGenerateAIBriefing = async () => {
    setIsLoading(true);

    try {
      const topDoneTitles = completedTasks.map((t) => (lang === "en" ? t.title_en || t.title : t.title)).join(", ");
      const topIssues = activeIssues.map((i) => (lang === "en" ? i.issue_description_en || i.issue_description : i.issue_description)).join("; ");

      const res = await fetch("/api/reports/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodLabel,
          tasksCount: tasks.length,
          completedCount: completedTasks.length,
          completedTitles: topDoneTitles,
          blockersList: topIssues,
          totalHours,
          lang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.briefing) {
          setBriefing(data.briefing);
          setIsLoading(false);
          return;
        }
      }

      // Fallback Generator
      setTimeout(() => {
        setBriefing(generateDefaultBriefing(lang));
        setIsLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setBriefing(generateDefaultBriefing(lang));
      setIsLoading(false);
    }
  };

  const handleCopyText = () => {
    const headerTitle =
      lang === "th"
        ? `📊 สรุปรายงานผู้บริหาร MedTree Design & Build (${periodLabel})`
        : `📊 MedTree Design & Build — Executive Briefing (${periodLabel})`;

    const headingAchieve = lang === "th" ? "🏆 ผลงานชิ้นสำคัญ (Key Accomplishments):" : "🏆 Key Accomplishments:";
    const headingRisks = lang === "th" ? "⚠️ จุดติดขัดและความเสี่ยง (Critical Risks):" : "⚠️ Critical Risks & Blockers:";
    const headingNext = lang === "th" ? "🎯 แผนปฏิบัติการที่ต้องเร่งผลักดัน (Strategic Next Steps):" : "🎯 Strategic Next Steps:";

    const textToCopy = `${headerTitle}
--------------------------------------------------
${headingAchieve}
${briefing.achievements.map((a, i) => `${i + 1}. ${a}`).join("\n")}

${headingRisks}
${briefing.risks.map((r, i) => `${i + 1}. ${r}`).join("\n")}

${headingNext}
${briefing.nextSteps.map((n, i) => `${i + 1}. ${n}`).join("\n")}
`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {lang === "th" ? "บทวิเคราะห์และสรุปผลผู้บริหาร (MeD3 AI Briefing)" : "MeD3 Executive Briefing & Analysis"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {lang === "th"
                ? `วิเคราะห์ภาพรวมผลงาน จุดเสี่ยง และคำแนะนำเชิงกลยุทธ์สำหรับรอบ: ${periodLabel}`
                : `Strategic insights, risk analysis, and actionable next steps for: ${periodLabel}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyText}
            className="text-xs h-8 gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? (lang === "th" ? "คัดลอกแล้ว!" : "Copied!") : (lang === "th" ? "คัดลอกบทสรุป" : "Copy Brief")}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleGenerateAIBriefing}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 shadow-xs cursor-pointer font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>
              {isLoading
                ? lang === "th"
                  ? "MeD3 กำลังวิเคราะห์..."
                  : "MeD3 Analyzing..."
                : lang === "th"
                ? "✨ MeD3ช่วยวิเคราะห์"
                : "✨ MeD3 Analysis"}
            </span>
          </Button>
        </div>
      </div>

      {/* 3 Executive Briefing Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {/* 1. Key Accomplishments */}
        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
            <Trophy className="h-4 w-4 text-emerald-600" />
            <span>{lang === "th" ? "1. ผลงานสำคัญที่สำเร็จ" : "1. Key Accomplishments"}</span>
          </div>
          <ul className="space-y-1.5 text-xs text-foreground/90 leading-relaxed">
            {briefing.achievements.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Critical Blockers & Risks */}
        <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span>{lang === "th" ? "2. จุดเสี่ยง & ประเด็นติดขัด" : "2. Risks & Blockers"}</span>
          </div>
          <ul className="space-y-1.5 text-xs text-foreground/90 leading-relaxed">
            {briefing.risks.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-rose-600 font-bold shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Strategic Next Steps */}
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 space-y-2.5">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-xs">
            <Target className="h-4 w-4 text-blue-600" />
            <span>{lang === "th" ? "3. แผนผลักดันสัปดาห์ถัดไป" : "3. Strategic Next Steps"}</span>
          </div>
          <ul className="space-y-1.5 text-xs text-foreground/90 leading-relaxed">
            {briefing.nextSteps.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-blue-600 font-bold shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
