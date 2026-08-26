"use client";

import React, { useState, useEffect } from "react";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Coffee,
  Sun,
  Flame,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

interface TimeTrackingSectionProps {
  taskId: string;
}

export function TimeTrackingSection({ taskId }: TimeTrackingSectionProps) {
  const { tasks, timeEntries, addTimeLog, deleteTimeLog, currentUser } = useTaskStore();
  const { t, lang } = useLanguage();

  const task = tasks.find((t) => t.id === taskId);
  const taskLogs = timeEntries.filter((e) => e.task_id === taskId);

  const totalMinutes = taskLogs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Manual Entry Form State
  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");
  const [logNote, setLogNote] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Live Timer State (Optional convenience stopwatch)
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 1. Quick Preset Handler (Zero-Stress, One-Click)
  const handleQuickPreset = (minutes: number, label: string) => {
    addTimeLog(taskId, {
      task_id: taskId,
      user_id: currentUser.id,
      duration_minutes: minutes,
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
      entry_type: "preset",
      note: `บันทึกเวลาทำงาน (${label})`,
      note_en: `Logged work time (${label})`,
      logged_at: new Date().toISOString(),
    });

    setFeedbackMsg(lang === "th" ? `บันทึกเวลา +${label} สำเร็จ!` : `Added +${label} successfully!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // 2. Custom Manual Entry Handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseInt(customHours || "0", 10);
    const m = parseInt(customMinutes || "0", 10);
    const total = h * 60 + m;

    if (total <= 0) return;

    addTimeLog(taskId, {
      task_id: taskId,
      user_id: currentUser.id,
      duration_minutes: total,
      hours: h,
      minutes: m,
      entry_type: "manual",
      note: logNote.trim() || (lang === "th" ? "บันทึกเวลาทำงานทั่วไป" : "General work log"),
      logged_at: new Date().toISOString(),
    });

    setCustomHours("");
    setCustomMinutes("");
    setLogNote("");
    setFeedbackMsg(lang === "th" ? "บันทึกเวลาทำงานเรียบร้อย!" : "Time logged successfully!");
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // 3. Save Live Timer
  const handleSaveTimer = () => {
    if (timerSeconds < 60) return;
    const mins = Math.round(timerSeconds / 60);

    addTimeLog(taskId, {
      task_id: taskId,
      user_id: currentUser.id,
      duration_minutes: mins,
      hours: Math.floor(mins / 60),
      minutes: mins % 60,
      entry_type: "timer",
      note: `จับเวลาสด (${mins} นาที)`,
      note_en: `Live stopwatch session (${mins} mins)`,
      logged_at: new Date().toISOString(),
    });

    setIsTimerRunning(false);
    setTimerSeconds(0);
    setFeedbackMsg(lang === "th" ? `บันทึกเวลาจากนาฬิกาจับเวลา (${mins} นาที) สำเร็จ!` : `Saved ${mins} mins from timer!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Summary KPI Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-muted-foreground block font-medium">
            {lang === "th" ? "ชั่วโมงทำงานรวมสะสมของงานนี้" : "Cumulative Work Hours for this Task"}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {totalHours}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {lang === "th" ? `ชั่วโมง (${totalMinutes} นาที)` : `Hours (${totalMinutes} mins)`}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {lang === "th"
              ? "💡 ข้อมูลชั่วโมงทำงานนี้ใช้ประเมินต้นทุนและป้องกันการจ่ายงานทับซ้อน (ไม่ใช่เครื่องมือจับผิด)"
              : "Used for workload planning and cost evaluation (supportive, non-punitive)"}
          </p>
        </div>

        {/* Live Timer Widget (Optional) */}
        <div className="p-3 rounded-xl bg-card border shadow-xs flex items-center gap-3">
          <div>
            <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3 text-emerald-600" />
              <span>{lang === "th" ? "จับเวลาสด (ทางเลือก)" : "Live Stopwatch"}</span>
            </div>
            <div className="font-mono font-bold text-lg text-foreground">
              {formatTimer(timerSeconds)}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!isTimerRunning ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsTimerRunning(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-2.5 text-xs gap-1"
              >
                <Play className="h-3 w-3" />
                <span>{lang === "th" ? "เริ่ม" : "Start"}</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsTimerRunning(false)}
                className="border-amber-500 text-amber-600 hover:bg-amber-50 h-8 px-2.5 text-xs gap-1"
              >
                <Pause className="h-3 w-3" />
                <span>{lang === "th" ? "พัก" : "Pause"}</span>
              </Button>
            )}

            {timerSeconds > 0 && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="h-8 w-8 p-0 text-muted-foreground"
                  title={lang === "th" ? "รีเซ็ต" : "Reset"}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveTimer}
                  disabled={timerSeconds < 60}
                  className="bg-teal-600 hover:bg-teal-700 text-white h-8 px-2.5 text-xs font-semibold"
                >
                  {lang === "th" ? "บันทึก" : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 1. Friendly Quick Preset Buttons */}
      <div className="p-4 rounded-xl border bg-card shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>{lang === "th" ? "ปุ่มลัดบันทึกเวลาทำงาน (One-Click Presets):" : "One-Click Quick Presets:"}</span>
          </label>
          <span className="text-[10px] text-muted-foreground">
            {lang === "th" ? "คลิกครั้งเดียวบันทึกทันที" : "Click to log instantly"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset(30, "30 นาที")}
            className="text-xs h-9 hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-950 font-semibold"
          >
            + 30 นาที
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset(60, "1 ชั่วโมง")}
            className="text-xs h-9 hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-950 font-semibold"
          >
            + 1 ชั่วโมง
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset(120, "2 ชั่วโมง")}
            className="text-xs h-9 hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-950 font-semibold"
          >
            + 2 ชั่วโมง
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset(240, "ครึ่งวัน (4 ชม.)")}
            className="text-xs h-9 hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-950 font-semibold text-teal-700 dark:text-teal-300"
          >
            + ครึ่งวัน (4 ชม.)
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickPreset(480, "1 วันเต็ม (8 ชม.)")}
            className="text-xs h-9 hover:bg-emerald-50 hover:border-emerald-400 dark:hover:bg-emerald-950 font-semibold text-emerald-800 dark:text-emerald-200 col-span-2 sm:col-span-1"
          >
            + 1 วันเต็ม (8 ชม.)
          </Button>
        </div>
      </div>

      {/* 2. Custom Manual Time Form */}
      <form onSubmit={handleManualSubmit} className="p-4 rounded-xl border bg-card shadow-sm space-y-3">
        <label className="text-xs font-bold text-foreground block">
          {lang === "th" ? "หรือระบุเวลาทำงานเองแบบละเอียด (Manual Entry):" : "Or specify custom hours:"}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">
              {lang === "th" ? "ชั่วโมง:" : "Hours:"}
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="0"
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">
              {lang === "th" ? "นาที:" : "Minutes:"}
            </label>
            <Input
              type="number"
              min="0"
              max="59"
              placeholder="0"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">
              {lang === "th" ? "หมายเหตุงานที่ทำ (ไม่บังคับ):" : "Work Note (Optional):"}
            </label>
            <Input
              type="text"
              placeholder={lang === "th" ? "เช่น เขียนแบบแปลนห้องน้ำชั้น 2" : "e.g. 2nd floor bathroom drafting"}
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            size="sm"
            disabled={!customHours && !customMinutes}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{lang === "th" ? "บันทึกเวลาลงสมุด" : "Log Work Time"}</span>
          </Button>
        </div>
      </form>

      {/* 3. Time Log History List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {lang === "th" ? "ประวัติการลงเวลาทำงานของงานนี้" : "Logged Time Entries History"} ({taskLogs.length})
        </h4>

        {taskLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center italic border rounded-xl bg-card">
            {lang === "th" ? "ยังไม่มีการบันทึกเวลาทำงานในงานนี้" : "No time logged yet for this task"}
          </p>
        ) : (
          <div className="divide-y rounded-xl border bg-card overflow-hidden">
            {taskLogs.map((entry) => {
              const displayNote = getLocalizedDynamicText(
                entry.note || (lang === "th" ? "บันทึกเวลาทำงาน" : "Work logged"),
                entry.note_en,
                lang
              );

              return (
                <div
                  key={entry.id}
                  className="p-3.5 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-foreground">
                        {entry.user?.full_name || (lang === "th" ? "สมาชิกในทีม" : "Team Member")}
                      </strong>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                        {entry.duration_minutes} {lang === "th" ? "นาที" : "mins"} ({((entry.duration_minutes || 0) / 60).toFixed(1)} ชม.)
                      </Badge>
                      {entry.entry_type === "preset" && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 font-medium">
                          ⚡ Preset
                        </span>
                      )}
                      {entry.entry_type === "timer" && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 dark:bg-teal-950 font-medium">
                          ⏱️ Stopwatch
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-[11px]">{displayNote}</p>
                    <span className="text-[10px] text-muted-foreground/60 block">
                      {formatDateTime(entry.logged_at || entry.created_at, lang)}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTimeLog(taskId, entry.id)}
                    className="h-7 w-7 text-muted-foreground/60 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                    title={lang === "th" ? "ลบรายการเวลานี้" : "Delete time entry"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
