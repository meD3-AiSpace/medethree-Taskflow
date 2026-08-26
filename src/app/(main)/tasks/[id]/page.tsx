"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { TaskStatus, TaskPriority } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  MessageSquare,
  History,
  Send,
  Trash2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  formatDate,
  formatDateTime,
  getCategoryLabel,
  getPriorityBadgeColor,
  getPriorityLabel,
  getStatusLabel,
} from "@/lib/utils";
import { IssueSection } from "@/components/tasks/issue-section";
import { PermitSection } from "@/components/tasks/permit-section";
import { ActivityTimeline } from "@/components/tasks/activity-timeline";
import { TimeTrackingSection } from "@/components/tasks/time-tracking-section";
import { DeliverablesAttachmentSection } from "@/components/tasks/deliverables-attachment-section";
import { QuickLogIssueModal } from "@/components/tasks/quick-issue-modal";
import { QuickAttachModal } from "@/components/tasks/quick-attach-modal";
import { translateText } from "@/lib/i18n/auto-translate";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";
import { Paperclip, Zap } from "lucide-react";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const { t, lang } = useLanguage();

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);

  const {
    tasks,
    comments,
    attachments,
    timeEntries,
    addComment,
    updateTaskStatus,
    updateTaskDetails,
    deleteTask,
    currentUser,
    geminiApiKey,
  } = useTaskStore();

  const task = tasks.find((t) => t.id === taskId);
  const taskComments = comments.filter((c) => c.task_id === taskId);
  const taskAttachments = attachments.filter((a) => a.task_id === taskId);
  const taskTimeEntries = timeEntries.filter((e) => e.task_id === taskId);
  const totalMinutes = taskTimeEntries.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const [commentInput, setCommentInput] = useState("");
  const [commentInputEn, setCommentInputEn] = useState("");
  const [isTranslatingComment, setIsTranslatingComment] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!task) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">
          {lang === "th" ? "ไม่พบข้อมูลงานที่ต้องการ" : "Task not found"}
        </p>
        <Link href="/tasks">
          <Button variant="outline" size="sm" className="text-xs">
            {t("backToTasks")}
          </Button>
        </Link>
      </div>
    );
  }

  const handleTranslateComment = async () => {
    if (!commentInput.trim()) return;
    setIsTranslatingComment(true);
    const res = await translateText(commentInput, geminiApiKey);
    setCommentInputEn(res.translatedText);
    setIsTranslatingComment(false);
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = updateTaskStatus(task.id, newStatus);
    if (!res.success) {
      setErrorMessage(res.message || (lang === "th" ? "ไม่สามารถเปลี่ยนสถานะได้ตามกฎ Workflow" : "State transition blocked by Workflow rules"));
    } else {
      setSuccessMessage(t("statusUpdated", { status: getStatusLabel(newStatus, lang) }));
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    await addComment(task.id, commentInput, commentInputEn || undefined);
    setCommentInput("");
    setCommentInputEn("");
    setSuccessMessage(lang === "th" ? "บันทึกคอมเมนต์สรุปผลงานเรียบร้อย" : "Comment / deliverable recorded successfully");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteTask = () => {
    if (confirm(lang === "th" ? "ยืนยันที่จะลบงานนี้หรือไม่?" : "Are you sure you want to delete this task?")) {
      const res = deleteTask(task.id);
      if (res.success) {
        router.push("/tasks");
      } else {
        setErrorMessage(res.message || "Cannot delete task");
      }
    }
  };

  const displayTitle = getLocalizedDynamicText(task.title, task.title_en, lang);
  const displayDescription = getLocalizedDynamicText(task.description || "", task.description_en, lang);
  const rawProjectName = task.project?.name || (lang === "th" ? "โครงการทั่วไป" : "General Project");
  const displayProject = getLocalizedDynamicText(rawProjectName, task.project?.name_en, lang);

  const workflowStages: Array<{ status: TaskStatus; label: string; desc: string }> = [
    { status: "todo", label: t("stTodo"), desc: lang === "th" ? "ยังไม่เริ่ม" : "Not started" },
    { status: "assigned", label: t("stAssigned"), desc: lang === "th" ? "ระบุคน+เวลา" : "Assigned" },
    { status: "in_progress", label: t("stInProgress"), desc: lang === "th" ? "เริ่มงาน" : "Working" },
    { status: "review", label: t("stReview"), desc: lang === "th" ? "ส่งตรวจ" : "In review" },
    { status: "completed", label: t("stCompleted"), desc: lang === "th" ? "ปิดงาน" : "Finished" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("backToTasks")}</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Attach Deliverable Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAttachModal(true)}
            className="text-xs h-8 gap-1.5 border-emerald-500/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
          >
            <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
            <span>{lang === "th" ? "+ แนบไฟล์ผลงาน" : "+ Attach Deliverable"}</span>
          </Button>

          {/* Quick Log Blocker Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowIssueModal(true)}
            className="text-xs h-8 gap-1.5 border-rose-400/60 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950 font-semibold"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            <span>{lang === "th" ? "+ บันทึกปัญหาที่พบ" : "+ Log Issue"}</span>
          </Button>

          {currentUser.role === "admin" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteTask}
              className="text-xs h-8 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t("deleteTaskAdmin")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Transition Stepper Bar (Section 4) */}
      <div className="p-4 rounded-xl border bg-card shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">{t("workflowStage")}</span>
          <span className="text-[11px] text-muted-foreground">
            {t("currentStatus")} <strong className="text-emerald-600">{getStatusLabel(task.status, lang)}</strong>
          </span>
        </div>

        {/* Stepper Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          {workflowStages.map((stage, idx) => {
            const isCurrent = task.status === stage.status;
            return (
              <button
                key={stage.status}
                type="button"
                onClick={() => handleStatusChange(stage.status)}
                className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                  isCurrent
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-600 text-emerald-900 dark:text-emerald-200 font-bold"
                    : "bg-muted/30 hover:bg-muted text-muted-foreground border-border"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span>{idx + 1}. {stage.label}</span>
                  {isCurrent && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                </div>
                <span className="text-[10px] text-muted-foreground font-normal">{stage.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Validation Error Banner */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">{t("validationFailed")}</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Main Task Detail Card */}
      <div className="p-6 rounded-xl border bg-card shadow-sm space-y-6">
        {/* Title, Category & Badges */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {displayProject}
            </Badge>
            <Badge
              variant={task.category === "permit" ? "success" : "default"}
              className="text-xs"
            >
              {getCategoryLabel(task.category, lang)}
            </Badge>
            <span
              className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold ${getPriorityBadgeColor(
                task.priority
              )}`}
            >
              {getPriorityLabel(task.priority, lang)}
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground leading-tight">{displayTitle}</h1>
        </div>

        {/* Meta Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 border text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("assignor")}</span>
            <strong className="text-foreground text-xs">{task.creator?.full_name || "-"}</strong>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("assignee")}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {task.assignees && task.assignees.length > 0 ? (
                task.assignees.map((a) => (
                  <strong key={a.id} className="text-foreground text-xs">
                    {a.full_name}
                  </strong>
                ))
              ) : (
                <span className="text-muted-foreground italic">{t("unassigned")}</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("deadline")}</span>
            <strong className="text-foreground text-xs">{formatDate(task.deadline, lang)}</strong>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">{t("createdAt")}</span>
            <span className="text-muted-foreground text-xs">{formatDate(task.created_at, lang)}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {t("descriptionTitle")}
          </h3>
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-line p-4 rounded-lg bg-background border">
            {displayDescription || t("noDesc")}
          </p>
        </div>

        {/* Feature Tabs: Issues, Deliverables, Time Tracking, Permit, Comments, Activity Log */}
        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="flex items-center gap-1 w-full h-auto p-1 bg-muted/60 rounded-xl overflow-x-auto flex-wrap sm:flex-nowrap">
            <TabsTrigger value="issues" className="text-xs gap-1.5 flex-1 min-w-[120px]">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{t("tabIssues")} ({task.unresolved_issues_count || 0})</span>
            </TabsTrigger>

            <TabsTrigger value="attachments" className="text-xs gap-1.5 flex-1 min-w-[130px]">
              <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
              <span>{lang === "th" ? "ไฟล์ผลงาน" : "Deliverables"} ({taskAttachments.length})</span>
            </TabsTrigger>

            <TabsTrigger value="timelog" className="text-xs gap-1.5 flex-1 min-w-[130px]">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>{lang === "th" ? "บันทึกเวลา" : "Work Log"} ({totalHours}h)</span>
            </TabsTrigger>

            {task.category === "permit" && (
              <TabsTrigger value="permit" className="text-xs gap-1.5 flex-1 min-w-[120px]">
                <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
                <span>{t("tabPermit")}</span>
              </TabsTrigger>
            )}

            <TabsTrigger value="comments" className="text-xs gap-1.5 flex-1 min-w-[110px]">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{t("tabComments")} ({taskComments.length})</span>
            </TabsTrigger>

            <TabsTrigger value="activity" className="text-xs gap-1.5 flex-1 min-w-[100px]">
              <History className="h-3.5 w-3.5" />
              <span>{t("tabActivity")}</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Issues (Section 3.7) */}
          <TabsContent value="issues" className="pt-4">
            <IssueSection taskId={task.id} />
          </TabsContent>

          {/* Tab 2: Deliverables & Attachments with Auto-Compression (Phase 2 & Section 3.5) */}
          <TabsContent value="attachments" className="pt-4">
            <DeliverablesAttachmentSection taskId={task.id} />
          </TabsContent>

          {/* Tab 3: Friendly Time Tracking & Work Log (Phase 2 & Section 3.9) */}
          <TabsContent value="timelog" className="pt-4">
            <TimeTrackingSection taskId={task.id} />
          </TabsContent>

          {/* Tab 4: Permit Details (Section 3.8) */}
          {task.category === "permit" && (
            <TabsContent value="permit" className="pt-4">
              <PermitSection task={task} />
            </TabsContent>
          )}

          {/* Tab 5: Comments & Discussion */}
          <TabsContent value="comments" className="pt-4 space-y-4">
            <div className="space-y-3">
              {taskComments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center italic">
                  {lang === "th" ? "ยังไม่มีคอมเมนต์พูดคุยในงานนี้" : "No comments or discussion yet"}
                </p>
              ) : (
                taskComments.map((comm) => {
                  const displayComment = getLocalizedDynamicText(comm.content, comm.content_en, lang);
                  return (
                    <div key={comm.id} className="p-3.5 rounded-xl border bg-background text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <strong className="text-foreground">{comm.user?.full_name || (lang === "th" ? "สมาชิกในทีม" : "Team Member")}</strong>
                        <span>{formatDateTime(comm.created_at, lang)}</span>
                      </div>
                      <p className="text-foreground leading-relaxed">{displayComment}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold">
                  {lang === "th" ? "บันทึกคอมเมนต์สรุปผลงาน:" : "Add Comment / Output Summary:"}
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleTranslateComment}
                  disabled={isTranslatingComment || !commentInput.trim()}
                  className="text-xs h-6 gap-1 border-emerald-500/60 text-emerald-700 dark:text-emerald-300"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>{isTranslatingComment ? "กำลังแปล..." : "✨ แปลอังกฤษ"}</span>
                </Button>
              </div>

              <Textarea
                rows={3}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={lang === "th" ? "พิมพ์ข้อความสรุปผลงาน ลิงก์ไฟล์งาน หรือข้อคิดเห็น..." : "Write summary, deliverables link, or discussion..."}
                className="text-xs"
              />

              {commentInputEn && (
                <div className="p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold block mb-0.5">
                    🇬🇧 English Translation (AI):
                  </span>
                  <Textarea
                    rows={2}
                    value={commentInputEn}
                    onChange={(e) => setCommentInputEn(e.target.value)}
                    className="text-xs bg-background"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{lang === "th" ? "ส่งคอมเมนต์ / ผลงาน" : "Submit Comment / Deliverable"}</span>
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Tab 6: Activity Log (Section 3.5) */}
          <TabsContent value="activity" className="pt-4">
            <ActivityTimeline taskId={task.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Log Issue Modal */}
      {showIssueModal && (
        <QuickLogIssueModal
          task={task}
          open={showIssueModal}
          onOpenChange={setShowIssueModal}
        />
      )}

      {/* Quick Attach Deliverable Modal */}
      {showAttachModal && (
        <QuickAttachModal
          task={task}
          open={showAttachModal}
          onOpenChange={setShowAttachModal}
        />
      )}
    </div>
  );
}
