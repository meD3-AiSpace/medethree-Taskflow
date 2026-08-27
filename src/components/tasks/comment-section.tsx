"use client";

import React, { useState } from "react";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Comment, UserRole } from "@/lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Send,
  Sparkles,
  Pencil,
  Trash2,
  Check,
  X,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { translateText } from "@/lib/i18n/auto-translate";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

interface CommentSectionProps {
  taskId: string;
}

export function CommentSection({ taskId }: CommentSectionProps) {
  const { comments, addComment, updateComment, deleteComment, currentUser, users } = useTaskStore();
  const { t, lang } = useLanguage();

  const taskComments = comments.filter((c) => c.task_id === taskId);

  // New Comment Form State
  const [commentInput, setCommentInput] = useState("");
  const [commentInputEn, setCommentInputEn] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Mode State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editContentEn, setEditContentEn] = useState("");
  const [isEditingTranslating, setIsEditingTranslating] = useState(false);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const showNotification = (success: boolean, msg: string) => {
    setFeedback({ success, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Translate New Comment
  const handleAutoTranslateNew = async () => {
    if (!commentInput.trim()) return;
    setIsTranslating(true);
    try {
      const res = await translateText(commentInput.trim());
      setCommentInputEn(res.translatedText);
    } catch {
      setCommentInputEn(commentInput);
    } finally {
      setIsTranslating(false);
    }
  };

  // Submit New Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment(taskId, commentInput.trim(), commentInputEn.trim() || undefined);
      setCommentInput("");
      setCommentInputEn("");
      showNotification(true, lang === "th" ? "บันทึกข้อคิดเห็นสำเร็จ!" : "Comment posted!");
    } catch (err) {
      showNotification(false, lang === "th" ? "เกิดข้อผิดพลาดในการบันทึก" : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Edit
  const handleStartEdit = (comm: Comment) => {
    setEditingCommentId(comm.id);
    setEditContent(comm.content);
    setEditContentEn(comm.content_en || "");
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
    setEditContentEn("");
  };

  // Translate Edited Comment
  const handleAutoTranslateEdit = async () => {
    if (!editContent.trim()) return;
    setIsEditingTranslating(true);
    try {
      const res = await translateText(editContent.trim());
      setEditContentEn(res.translatedText);
    } catch {
      setEditContentEn(editContent);
    } finally {
      setIsEditingTranslating(false);
    }
  };

  // Save Edit
  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await updateComment(commentId, editContent.trim(), editContentEn.trim() || undefined);
      setEditingCommentId(null);
      showNotification(true, lang === "th" ? "อัปเดตข้อคิดเห็นเรียบร้อย!" : "Comment updated!");
    } catch {
      showNotification(false, lang === "th" ? "อัปเดตไม่สำเร็จ" : "Failed to update");
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm(lang === "th" ? "ยืนยันการลบข้อคิดเห็นนี้?" : "Delete this comment?")) {
      try {
        await deleteComment(commentId);
        showNotification(true, lang === "th" ? "ลบข้อคิดเห็นสำเร็จ!" : "Comment deleted!");
      } catch {
        showNotification(false, lang === "th" ? "ลบไม่สำเร็จ" : "Failed to delete");
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          <span>
            {lang === "th" ? "ข้อคิดเห็น & บันทึกสรุปงาน (Comments & Discussion)" : "Comments & Discussion"}
          </span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
            {taskComments.length}
          </span>
        </h3>
      </div>

      {feedback && (
        <div
          className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in ${
            feedback.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          {feedback.success ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {taskComments.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed bg-muted/20 text-muted-foreground text-xs space-y-1">
            <MessageSquare className="h-6 w-6 mx-auto opacity-40 mb-1" />
            <p className="font-semibold">
              {lang === "th" ? "ยังไม่มีข้อคิดเห็นในงานนี้" : "No comments on this task yet"}
            </p>
            <p className="text-[11px]">
              {lang === "th" ? "พิมพ์บันทึกข้อความสรุปผลงาน หรือประสานงานทีมได้ที่ฟอร์มด้านล่าง" : "Post notes, summary links, or discuss with the team below"}
            </p>
          </div>
        ) : (
          taskComments.map((comm) => {
            const author = users.find((u) => u.id === comm.user_id) || comm.user;
            const authorName = author?.full_name || (lang === "th" ? "สมาชิกทีม" : "Team Member");
            const authorRole = author?.role || "member";
            const isMyComment = comm.user_id === currentUser.id || currentUser.role === "admin";
            const isEditing = editingCommentId === comm.id;
            const displayContent = getLocalizedDynamicText(comm.content, comm.content_en, lang);

            const initials = authorName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();

            return (
              <div
                key={comm.id}
                className="p-3.5 rounded-xl border bg-card hover:shadow-2xs transition-all text-xs space-y-2 group"
              >
                {/* Author Info & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-6 w-6 text-[10px] shrink-0">
                      <AvatarFallback className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <strong className="text-foreground text-xs">{authorName}</strong>
                      <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-muted uppercase text-muted-foreground">
                        {authorRole}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(comm.created_at, lang)}
                    </span>

                    {/* Edit/Delete buttons if authorized */}
                    {isMyComment && !isEditing && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(comm)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                          title={lang === "th" ? "แก้ไขข้อคิดเห็น" : "Edit comment"}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comm.id)}
                          className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                          title={lang === "th" ? "ลบข้อคิดเห็น" : "Delete comment"}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comment Content (View vs Edit Mode) */}
                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {lang === "th" ? "แก้ไขข้อความ:" : "Edit note:"}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAutoTranslateEdit}
                        disabled={isEditingTranslating || !editContent.trim()}
                        className="text-[10px] h-5 gap-1 border-emerald-500/50"
                      >
                        <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
                        <span>{isEditingTranslating ? "กำลังแปล..." : "✨ แปลอังกฤษ"}</span>
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="text-xs"
                    />
                    {editContentEn && (
                      <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border text-[11px] space-y-1">
                        <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">
                          🇬🇧 English:
                        </span>
                        <Textarea
                          rows={2}
                          value={editContentEn}
                          onChange={(e) => setEditContentEn(e.target.value)}
                          className="text-xs bg-background h-6"
                        />
                      </div>
                    )}
                    <div className="flex justify-end gap-1 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="h-7 text-xs"
                      >
                        {lang === "th" ? "ยกเลิก" : "Cancel"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEdit(comm.id)}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {lang === "th" ? "บันทึกการแก้ไข" : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground leading-relaxed whitespace-pre-line text-xs pl-8">
                    {displayContent}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add New Comment Form */}
      <form onSubmit={handleAddComment} className="pt-4 border-t space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-foreground">
            {lang === "th" ? "พิมพ์ข้อคิดเห็น สรุปผลงาน หรือประสานงานทีม:" : "Add Comment / Output Summary:"}
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAutoTranslateNew}
            disabled={isTranslating || !commentInput.trim()}
            className="text-xs h-6 gap-1 border-emerald-500/60 text-emerald-700 dark:text-emerald-300 cursor-pointer"
          >
            <Sparkles className="h-3 w-3" />
            <span>{isTranslating ? (lang === "th" ? "กำลังแปล..." : "Translating...") : (lang === "th" ? "✨ แปลอังกฤษ" : "✨ Translate")}</span>
          </Button>
        </div>

        <Textarea
          rows={3}
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          placeholder={
            lang === "th"
              ? "พิมพ์ข้อความสรุปผลงาน ลิงก์ไฟล์งาน หรือแท็กเพื่อนร่วมงาน..."
              : "Write deliverable summary, share links, or discuss with the team..."
          }
          className="text-xs"
        />

        {commentInputEn && (
          <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] animate-in fade-in space-y-1">
            <span className="text-emerald-800 dark:text-emerald-300 font-bold block">
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
            disabled={isSubmitting || !commentInput.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-xs cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isSubmitting ? (lang === "th" ? "กำลังส่ง..." : "Posting...") : (lang === "th" ? "ส่งข้อคิดเห็น" : "Post Comment")}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
