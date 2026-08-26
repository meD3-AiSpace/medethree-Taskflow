"use client";

import React, { useState } from "react";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Clock, Plus, ShieldAlert, Sparkles } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { translateText } from "@/lib/i18n/auto-translate";

interface IssueSectionProps {
  taskId: string;
}

export function IssueSection({ taskId }: IssueSectionProps) {
  const { issues, addIssue, resolveIssue, currentUser, geminiApiKey } = useTaskStore();
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
    const res = await translateText(newIssueDesc, geminiApiKey);
    setNewIssueDescEn(res.translatedText);
    setIsTranslating(false);
  };

  const handleTranslateResolution = async () => {
    if (!resolutionDesc.trim()) return;
    setIsTranslating(true);
    const res = await translateText(resolutionDesc, geminiApiKey);
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

            return (
              <div
                key={issue.id}
                className={`p-4 rounded-xl border transition-all ${
                  issue.is_resolved
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                    : "bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {issue.is_resolved ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            issue.is_resolved
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse"
                          }`}
                        >
                          {issue.is_resolved ? t("statusResolved") : t("statusUnresolved")}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {t("raisedAt")} {formatDateTime(issue.raised_at, lang)} {t("byUser")}{" "}
                          <strong className="text-foreground">{issue.raised_user?.full_name || (lang === "th" ? "สมาชิกในทีม" : "Team member")}</strong>
                        </span>
                      </div>

                      {/* Problem Description */}
                      <p className="text-xs font-semibold text-foreground leading-relaxed">
                        {displayDesc}
                      </p>

                      {/* Resolution if resolved */}
                      {issue.is_resolved && (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-background/80 border border-emerald-200 dark:border-emerald-900 text-xs">
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mb-0.5">
                            {t("resolutionMethod")}
                          </div>
                          <p className="text-muted-foreground">{displayRes}</p>
                          <div className="text-[10px] text-muted-foreground/70 mt-1">
                            {t("resolvedBy")} <strong>{issue.resolved_user?.full_name || currentUser.full_name}</strong> ({formatDateTime(issue.resolved_at, lang)})
                          </div>
                        </div>
                      )}
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shrink-0"
                    >
                      {t("btnMarkResolved")}
                    </Button>
                  )}
                </div>
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
