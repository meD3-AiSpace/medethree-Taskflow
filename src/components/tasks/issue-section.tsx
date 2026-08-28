"use client";

import React, { useState } from "react";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Clock, Plus, ShieldAlert, Sparkles, UserCheck, ShieldCheck, User, Wrench, Calendar, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/utils";
import { translateText } from "@/lib/i18n/auto-translate";

interface IssueSectionProps {
  taskId: string;
}

export function IssueSection({ taskId }: IssueSectionProps) {
  const { issues, addIssue, resolveIssue, currentUser } = useTaskStore();
  const { t, lang } = useLanguage();
  const taskIssues = issues.filter((i) => i.task_id === taskId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const [newIssueDesc, setNewIssueDesc] = useState("");
  const [newIssueDescEn, setNewIssueDescEn] = useState("");
  const [resolutionDesc, setResolutionDesc] = useState("");
  const [resolutionDescEn, setResolutionDescEn] = useState("");

  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslateIssue = async () => {
    if (!newIssueDesc.trim()) return;
    setIsTranslating(true);
    const res = await translateText(newIssueDesc);
    setNewIssueDescEn(res.translatedText);
    setIsTranslating(false);
  };

  const handleTranslateResolution = async () => {
    if (!resolutionDesc.trim()) return;
    setIsTranslating(true);
    const res = await translateText(resolutionDesc);
    setResolutionDescEn(res.translatedText);
    setIsTranslating(false);
  };

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueDesc.trim()) return;
    await addIssue(taskId, newIssueDesc, newIssueDescEn || undefined);
    setNewIssueDesc("");
    setNewIssueDescEn("");
    setShowAddModal(false);
  };

  const handleResolveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId || !resolutionDesc.trim()) return;
    await resolveIssue(selectedIssueId, resolutionDesc, resolutionDescEn || undefined);
    setResolutionDesc("");
    setResolutionDescEn("");
    setSelectedIssueId(null);
    setShowResolveModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Header with Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span>{t("issueSectionTitle")}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("issueSectionSub")}
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddModal(true)}
          className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t("btnLogIssue")}</span>
        </Button>
      </div>

      {/* List of Issues */}
      <div className="space-y-3">
        {taskIssues.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center bg-muted/20">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-foreground">{t("noIssues")}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("noIssuesSub")}
            </p>
          </div>
        ) : (
          taskIssues.map((issue) => {
            const displayDesc = lang === "en" && issue.issue_description_en ? issue.issue_description_en : issue.issue_description;
            const displayRes = lang === "en" && issue.resolution_description_en ? issue.resolution_description_en : issue.resolution_description;
            const resolverName = issue.resolved_user?.full_name || (issue.resolved_by === currentUser.id ? currentUser.full_name : "ผู้ดูแลระบบ (Admin)");
            const resolverRole = issue.resolved_user?.role || (issue.resolved_by === currentUser.id ? currentUser.role : "admin");

            return (
              <div
                key={issue.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  issue.is_resolved
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/60 shadow-xs"
                    : "bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/80 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    {issue.is_resolved ? (
                      <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Status & Reporter Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={issue.is_resolved ? "success" : "destructive"}
                          className="text-[10px] font-bold px-2 py-0.5"
                        >
                          {issue.is_resolved
                            ? (lang === "th" ? "✅ ปลดบล็อกสำเร็จ (Resolved)" : "✅ Resolved")
                            : (lang === "th" ? "🚨 ปัญหาติดขัด (Active Blocker)" : "🚨 Active Blocker")}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span>{t("raisedAt")} {formatDateTime(issue.raised_at, lang)}</span>
                          <span>•</span>
                          <span>{t("byUser")}</span>
                          <strong className="text-foreground">{issue.raised_user?.full_name || (lang === "th" ? "ผู้รายงาน" : "Reporter")}</strong>
                        </span>
                      </div>

                      {/* Problem Description */}
                      <p className="text-xs font-semibold text-foreground leading-relaxed pt-0.5">
                        {displayDesc}
                      </p>
                    </div>
                  </div>

                  {/* Action button if unresolved */}
                  {!issue.is_resolved && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedIssueId(issue.id);
                        setShowResolveModal(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 gap-1 shrink-0 shadow-sm cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      <span>{lang === "th" ? "บันทึกการแก้ปัญหา" : "Resolve Issue"}</span>
                    </Button>
                  )}
                </div>

                {/* Provenance Box: Who resolved it, when, and resolution details */}
                {issue.is_resolved && (
                  <div className="p-3.5 rounded-xl bg-background/90 border border-emerald-200 dark:border-emerald-900/80 shadow-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {resolverName.trim().charAt(0).toUpperCase()}
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground text-[10px] block">{lang === "th" ? "ผู้ดำเนินการแก้ไขปัญหา:" : "Resolved By:"}</span>
                          <strong className="text-foreground font-bold">{resolverName}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] uppercase font-bold border-emerald-400 text-emerald-800 dark:text-emerald-300">
                          ROLE: {resolverRole}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTime(issue.resolved_at || new Date().toISOString(), lang)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-0.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        <span>{lang === "th" ? "แนวทางและวิธีการแก้ไขปัญหา (Resolution Method):" : "Resolution Method & Action Taken:"}</span>
                      </span>
                      <p className="text-xs text-foreground/90 leading-relaxed font-medium bg-emerald-50/40 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                        {displayRes || (lang === "th" ? "ได้รับการแก้ไขและตรวจสอบความถูกต้องเรียบร้อยแล้ว" : "Issue inspected and resolved.")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Issue */}
      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent onClose={() => setShowAddModal(false)}>
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="text-sm font-bold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <span>{t("modalLogIssueTitle")}</span>
                </DialogTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleTranslateIssue}
                  disabled={isTranslating || !newIssueDesc.trim()}
                  className="text-xs h-7 gap-1 border-rose-400 text-rose-700 hover:bg-rose-50"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{isTranslating ? "กำลังแปล..." : "✨ แปลอังกฤษ"}</span>
                </Button>
              </div>
            </DialogHeader>
            <form onSubmit={handleAddIssue} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  {t("modalLogIssueDesc")} <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  rows={3}
                  required
                  value={newIssueDesc}
                  onChange={(e) => setNewIssueDesc(e.target.value)}
                  placeholder={lang === "th" ? "เช่น แบบสถาปัตย์ชนกับคานโครงสร้างชั้น 2 หรือติดเอกสารเพิ่มเติม..." : "e.g. Structural beam clash on 3rd floor..."}
                  className="text-xs"
                />
              </div>

              {newIssueDescEn && (
                <div className="p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold block mb-0.5">
                    🇬🇧 English Translation (AI):
                  </span>
                  <Textarea
                    rows={2}
                    value={newIssueDescEn}
                    onChange={(e) => setNewIssueDescEn(e.target.value)}
                    className="text-xs bg-background"
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  {t("cancelEdit")}
                </Button>
                <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
                  {t("saveBtn")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Resolve Issue */}
      {showResolveModal && (
        <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
          <DialogContent onClose={() => setShowResolveModal(false)}>
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{t("modalResolveIssueTitle")}</span>
                </DialogTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleTranslateResolution}
                  disabled={isTranslating || !resolutionDesc.trim()}
                  className="text-xs h-7 gap-1 border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{isTranslating ? "กำลังแปล..." : "✨ แปลอังกฤษ"}</span>
                </Button>
              </div>
            </DialogHeader>
            <form onSubmit={handleResolveIssue} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  {t("modalResolveIssueDesc")} <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  rows={3}
                  required
                  value={resolutionDesc}
                  onChange={(e) => setResolutionDesc(e.target.value)}
                  placeholder={lang === "th" ? "เช่น ปรับขยับแนวท่องานระบบลง 10 cm และได้ปรึกษาวิศวกรโครงสร้างแล้ว..." : "e.g. Adjusted MEP pipe offset..."}
                  className="text-xs"
                />
              </div>

              {resolutionDescEn && (
                <div className="p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold block mb-0.5">
                    🇬🇧 English Translation (AI):
                  </span>
                  <Textarea
                    rows={2}
                    value={resolutionDescEn}
                    onChange={(e) => setResolutionDescEn(e.target.value)}
                    className="text-xs bg-background"
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowResolveModal(false)}>
                  {t("cancelEdit")}
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {t("saveBtn")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
