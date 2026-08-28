"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Task } from "@/lib/types/database.types";
import { translateText } from "@/lib/i18n/auto-translate";
import { CheckCircle2, Sparkles, Wrench, Clock, AlertCircle } from "lucide-react";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

interface QuickResolveModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickResolveModal({ task, open, onOpenChange }: QuickResolveModalProps) {
  const { issues, resolveIssue, currentUser } = useTaskStore();
  const { t, lang } = useLanguage();

  const [resolution, setResolution] = useState("");
  const [resolutionEn, setResolutionEn] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!task) return null;

  // Find active unresolved issues for this task
  const activeIssues = issues.filter(
    (i) => i.task_id === task.id && !i.is_resolved
  );

  const targetIssue = activeIssues[0];
  const displayTitle = getLocalizedDynamicText(task.title, task.title_en, lang);
  const displayIssueDesc = targetIssue
    ? getLocalizedDynamicText(targetIssue.issue_description, targetIssue.issue_description_en, lang)
    : "";

  const handleTranslate = async () => {
    if (!resolution.trim()) return;
    setIsTranslating(true);
    const res = await translateText(resolution);
    setResolutionEn(res.translatedText);
    setIsTranslating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolution.trim() || !targetIssue) return;
    setIsSubmitting(true);

    try {
      await resolveIssue(targetIssue.id, resolution.trim(), resolutionEn.trim() || undefined);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setResolution("");
        setResolutionEn("");
        onOpenChange(false);
      }, 1200);
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
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {lang === "th" ? "บันทึกการแก้ไขปัญหา (Resolve Blocker)" : "Resolve Blocker / Issue"}
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
              {lang === "th" ? "ปลดบล็อกและบันทึกการแก้ไขสำเร็จ!" : "Blocker Resolved Successfully!"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === "th"
                ? `บันทึกผู้แก้ไข: ${currentUser.full_name} (${currentUser.role.toUpperCase()}) เรียบร้อยแล้ว`
                : `Resolved by ${currentUser.full_name} (${currentUser.role.toUpperCase()})`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
            {/* Blocker Context Box */}
            {targetIssue && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                  <span>{lang === "th" ? "ปัญหาติดขัดที่พบในขณะนี้:" : "Active Blocker Reported:"}</span>
                </div>
                <p className="text-foreground text-xs font-semibold pl-5">
                  {displayIssueDesc}
                </p>
              </div>
            )}

            {/* Resolver Provenance Preview */}
            <div className="p-2.5 rounded-lg bg-muted/40 border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {(currentUser.full_name || "?").trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">{lang === "th" ? "ผู้บันทึกการแก้ไข:" : "Resolver Identity:"}</span>
                  <strong className="text-foreground text-xs font-bold">{currentUser.full_name}</strong>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] uppercase font-bold border-emerald-400 text-emerald-800 dark:text-emerald-300">
                ROLE: {currentUser.role}
              </Badge>
            </div>

            {/* Resolution Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <Wrench className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{lang === "th" ? "ระบุวิธีและแนวทางที่ใช้แก้ไขปัญหา" : "Resolution Method & Action Taken"}</span>
                  <span className="text-rose-500">*</span>
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleTranslate}
                  disabled={isTranslating || !resolution.trim()}
                  className="text-[11px] h-6 px-2 gap-1 border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{isTranslating ? "กำลังแปล..." : "✨ แปลอังกฤษ"}</span>
                </Button>
              </div>

              <Textarea
                rows={3}
                required
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder={
                  lang === "th"
                    ? "เช่น สอบถามผู้ออกแบบโครงสร้างเพื่อขอเจาะคานเพื่อเดินท่อผ่าน ผู้ออกแบบอนุมัติและระบุตำแหน่งให้แล้ว..."
                    : "e.g. Inquired structural engineer and received approval for beam penetration..."
                }
                className="text-xs"
              />
            </div>

            {/* English Translation Box */}
            {resolutionEn && (
              <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1 animate-in fade-in">
                <span className="text-emerald-800 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                  <span>🇬🇧 English Translation (AI):</span>
                </span>
                <Textarea
                  rows={2}
                  value={resolutionEn}
                  onChange={(e) => setResolutionEn(e.target.value)}
                  className="text-xs bg-background"
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                {t("cancelEdit")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !resolution.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
              >
                {isSubmitting ? (lang === "th" ? "กำลังบันทึก..." : "Saving...") : (lang === "th" ? "✅ บันทึกการแก้ไขปัญหา" : "Mark Resolved")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
