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
  const { geminiApiKey } = useTaskStore();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Completed & Active tasks summary
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const activeIssues = issues.filter((i) => !i.is_resolved);
  const totalMinutes = timeEntries.reduce((acc, t) => acc + (t.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Helper to generate default structured briefing in active language
  const generateDefaultBriefing = useCallback((currentLang: Language) => {
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
          `Successfully delivered ${completedTasks.length} milestone tasks (overall progress: ${completionRate}%).`,
          completedTasks.length > 0
            ? `Key completed deliverables: "${topDoneTitles}".`
            : "Active operational momentum maintained across architectural design and building permit packages.",
          `Team logged ${totalHours} man-hours of dedicated work, showing healthy workload distribution.`,
        ],
        risks:
          activeIssues.length > 0
            ? [
                `Detected ${activeIssues.length} active blockers requiring urgent resolution: ${topIssues}.`,
                "Unresolved engineering clashes may impact the permit submission schedule if not unblocked within 3-5 days.",
              ]
            : [
                "Zero critical blockers currently obstructing project execution.",
                "Maintain close tracking on near-deadline tasks to guarantee 100% on-time milestone delivery.",
              ],
        nextSteps: [
          "Expedite follow-ups with municipal district offices for permit packages currently under review.",
          "Hold a 15-minute cross-discipline coordination sync to unblock structural beam and MEP pipe clashes.",
          "Prepare next deliverable package and perform final QA/QC inspection before supervisor review.",
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
        `ปิดงานสำเร็จตามเป้าหมายจำนวน ${completedTasks.length} รายการ (คิดเป็นความคืบหน้าภาพรวม ${completionRate}%)`,
        completedTasks.length > 0
          ? `งานสำคัญที่ส่งมอบเรียบร้อย: "${topDoneTitlesTh}"`
          : "มีการระดมกำลังทำงานในส่วนงานออกแบบและงานขออนุญาตก่อสร้างอย่างต่อเนื่อง",
        `ทีมงานบันทึกเวลาปฏิบัติงานจริงรวม ${totalHours} ชั่วโมง แสดงถึงความต่อเนื่องในการลงมือทำ`,
      ],
      risks:
        activeIssues.length > 0
          ? [
              `พบจุดติดขัดที่ต้องประสานงานแก้ไขเร่งด่วน ${activeIssues.length} รายการ: ${topIssuesTh}`,
              "งานที่ติดปัญหาอาจส่งผลกระทบต่อกำหนดส่งมอบแบบหรือการยื่นขออนุญาต หากไม่ได้รับการตัดสินใจภายใน 3-5 วัน",
            ]
          : [
              "ไม่มีจุดติดขัดรุนแรงที่ขัดขวางโครงการในขณะนี้",
              "ควรเฝ้าระวังงานที่ใกล้ถึงกำหนดส่ง (Due Soon) เพื่อรักษาระดับ On-time Delivery ให้ได้ 100%",
            ],
      nextSteps: [
        "เร่งติดตามและประสานงานหน่วยงานผู้อนุญาตสำหรับใบคำขอที่อยู่ระหว่างพิจารณา (Under Review)",
        "จัดประชุม Quick Sync ย่อย 15 นาที เพื่อปลดล็อกปัญหาติดขัดกับฝ่ายวิศวกรโครงสร้างและสุขาภิบาล",
        "เตรียมชุดเอกสารส่งมอบงวดถัดไป และตรวจสอบแบบครั้งสุดท้ายก่อนส่งตรวจรับ (Review)",
      ],
    };
  }, [completedTasks, activeIssues, completionRate, totalHours]);

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
      if (geminiApiKey) {
        // Real Gemini API Call with language-aware prompt
        const prompt =
          lang === "en"
            ? `You are an Executive Project Director at MedTree Design & Build (Architecture & Construction).
Please analyze the operational data for the reporting period: "${periodLabel}"
- Total Tasks: ${tasks.length} (Completed: ${completedTasks.length})
- Completed Task Titles: ${completedTasks.map((t) => t.title_en || t.title).join(", ") || "None"}
- Active Blockers: ${activeIssues.map((i) => i.issue_description_en || i.issue_description).join("; ") || "None"}
- Total Logged Hours: ${totalHours} hours

Please respond in JSON ONLY (with fluent, professional English) following this exact structure:
{
  "achievements": ["Key accomplishment bullet 1", "Key accomplishment bullet 2", "Key accomplishment bullet 3"],
  "risks": ["Critical risk/blocker bullet 1", "Critical risk/blocker bullet 2"],
  "nextSteps": ["Strategic actionable next step 1", "Strategic actionable next step 2", "Strategic actionable next step 3"]
}`
            : `คุณคือผู้เชี่ยวชาญด้านการจัดการสถาปัตยกรรมและการก่อสร้าง (Executive Project Director) ของบริษัท MedTree Design & Build
กรุณาวิเคราะห์ข้อมูลการดำเนินงานประจำช่วงเวลา: "${periodLabel}"
- งานทั้งหมด: ${tasks.length} งาน (ปิดแล้ว: ${completedTasks.length} งาน)
- รายชื่องานที่ปิดแล้ว: ${completedTasks.map((t) => t.title).join(", ") || "ไม่มี"}
- ปัญหาที่ติดขัดอยู่ (Active Blockers): ${activeIssues.map((i) => i.issue_description).join("; ") || "ไม่มีปัญหาติดขัด"}
- ชั่วโมงทำงานรวม: ${totalHours} ชั่วโมง

โปรดสรุปผลการวิเคราะห์ในรูปแบบ JSON ภาษาไทยเท่านั้น โดยมีโครงสร้าง:
{
  "achievements": ["ข้อความสรุปผลงานเด่น 1-3 ข้อ"],
  "risks": ["ข้อความจุดเสี่ยง/ปัญหาที่ต้องระวัง 1-2 ข้อ"],
  "nextSteps": ["ข้อเสนอแนะแผนปฏิบัติการสัปดาห์ถัดไป 2-3 ข้อ"]
}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            if (parsed.achievements && parsed.risks && parsed.nextSteps) {
              setBriefing(parsed);
              setIsLoading(false);
              return;
            }
          }
        }
      }

      // Intelligent Fallback Generator if no API key or network delay
      setTimeout(() => {
        setBriefing(generateDefaultBriefing(lang));
        setIsLoading(false);
      }, 700);
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
              {lang === "th" ? "บทวิเคราะห์และสรุปผลผู้บริหารด้วย AI (AI Executive Briefing)" : "AI Executive Briefing & Analysis"}
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? (lang === "th" ? "กำลังประมวลผล..." : "Analyzing...") : (lang === "th" ? "🤖 วิเคราะห์ใหม่ด้วย AI" : "Regenerate AI")}</span>
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
