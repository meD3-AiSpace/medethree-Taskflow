"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Task } from "@/lib/types/database.types";
import { translateText } from "@/lib/i18n/auto-translate";
import { ShieldAlert, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

interface QuickLogIssueModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickLogIssueModal({ task, open, onOpenChange }: QuickLogIssueModalProps) {
  const { addIssue } = useTaskStore();
  const { t, lang } = useLanguage();

  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!task) return null;

  const displayTitle = getLocalizedDynamicText(task.title, task.title_en, lang);

  const handleTranslate = async () => {
    if (!description.trim()) return;
    setIsTranslating(true);
    const res = await translateText(description);
    setDescriptionEn(res.translatedText);
    setIsTranslating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setIsSubmitting(true);

    try {
      await addIssue(task.id, description.trim(), descriptionEn.trim() || undefined);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription("");
        setDescriptionEn("");
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-2 pr-6">
            <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {lang === "th" ? "บันทึกปัญหาที่พบ / จุดติดขัด (Log Blocker)" : "Log Issue / Blocker"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground truncate max-w-[380px]">
                {lang === "th" ? `สำหรับงาน: ${displayTitle}` : `For task: ${displayTitle}`}
              </p>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-2 animate-in fade-in">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">
              {lang === "th" ? "บันทึกปัญหาติดขัดเรียบร้อย!" : "Blocker Issue Logged Successfully!"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === "th"
                ? "ระบบได้แจ้งเตือนผู้รับผิดชอบและบันทึกประวัติการดำเนินงานแล้ว"
                : "The system notified the assignees and updated the activity log."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {lang === "th"
                  ? "การบันทึกปัญหาติดขัดจะทำให้การ์ดงานมีสัญลักษณ์เตือนสีแดงกระพริบ เพื่อให้ทีมเข้ามาช่วยปลดบล็อกได้ทันที"
                  : "Logging an issue flags the task card with an urgent badge to notify the team."}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  {lang === "th" ? "รายละเอียดปัญหาที่พบ (ระบุสาเหตุ / จุดที่ติดขัด): *" : "Issue Description: *"}
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleTranslate}
                  disabled={isTranslating || !description.trim()}
                  className="text-xs h-6 gap-1 border-emerald-500/60 text-emerald-700 dark:text-emerald-300"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>{isTranslating ? "กำลังแปล..." : "✨ แปลอังกฤษ"}</span>
                </Button>
              </div>

              <Textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  lang === "th"
                    ? "เช่น คานระดับ +3.20m ชนแนวท่อระบายน้ำหลัก หรือ ระยะร่นด้านข้างอาคารไม่พอ..."
                    : "e.g., Beam clash at +3.20m with drainage pipe or setback violation..."
                }
                className="text-xs"
              />

              {descriptionEn && (
                <div className="p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold block mb-0.5">
                    🇬🇧 English Translation (AI):
                  </span>
                  <Textarea
                    rows={2}
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    className="text-xs bg-background"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                {lang === "th" ? "ยกเลิก" : "Cancel"}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !description.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold gap-1.5"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "กำลังบันทึก..." : lang === "th" ? "บันทึกปัญหาติดขัด" : "Log Issue"}</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
