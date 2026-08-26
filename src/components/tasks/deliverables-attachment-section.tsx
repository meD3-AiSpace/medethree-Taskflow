"use client";

import React, { useState, useRef } from "react";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { TaskAttachment } from "@/lib/types/database.types";
import { compressImageFile } from "@/lib/utils/image-compressor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Layers,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  Sparkles,
  Zap,
  X,
  Maximize2,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface DeliverablesAttachmentSectionProps {
  taskId: string;
}

export function DeliverablesAttachmentSection({ taskId }: DeliverablesAttachmentSectionProps) {
  const { tasks, attachments, addAttachment, deleteAttachment, currentUser } = useTaskStore();
  const { t, lang } = useLanguage();

  const task = tasks.find((t) => t.id === taskId);
  const taskAttachments = attachments.filter((a) => a.task_id === taskId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Preview Modal State
  const [previewAttachment, setPreviewAttachment] = useState<TaskAttachment | null>(null);

  // Handle File Selection and Compression
  const handleProcessFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Automatic client-side compression
        const result = await compressImageFile(file);

        addAttachment(taskId, {
          task_id: taskId,
          file_name: result.file_name,
          file_type: result.file_type,
          file_url: result.file_url,
          thumbnail_url: result.thumbnail_url || result.file_url,
          original_size_kb: result.original_size_kb,
          compressed_size_kb: result.compressed_size_kb,
          saved_percent: result.saved_percent,
          uploaded_by: currentUser.id,
        });
      }

      setFeedbackMsg(
        lang === "th"
          ? "อัปโหลดและบีบอัดไฟล์ผลงานสำเร็จเรียบร้อย!"
          : "Uploaded and optimized deliverable files successfully!"
      );
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleProcessFiles(e.dataTransfer.files);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-emerald-600" />;
      case "pdf":
        return <FileText className="h-5 w-5 text-rose-600" />;
      case "spreadsheet":
        return <FileSpreadsheet className="h-5 w-5 text-emerald-700" />;
      case "cad":
        return <Layers className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5 text-slate-600" />;
    }
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

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[1.01]"
            : "border-border hover:border-emerald-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.dwg,.dxf,.xls,.xlsx,.csv,.doc,.docx"
          onChange={(e) => handleProcessFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
            <Upload className="h-5 w-5" />
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground">
              {isUploading
                ? lang === "th"
                  ? "⚡ กำลังบีบอัดและอัปโหลดไฟล์..."
                  : "⚡ Optimizing and uploading..."
                : lang === "th"
                ? "คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่"
                : "Click to upload or drag and drop files here"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {lang === "th"
                ? "รองรับภาพถ่ายหน้างาน (JPG/PNG), แบบแปลน (PDF/DWG), และงบประมาณ (Excel)"
                : "Supports site photos (JPG/PNG), plans (PDF/DWG), and spreadsheets"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-semibold">
            <Zap className="h-3 w-3 text-emerald-600" />
            <span>{lang === "th" ? "⚡ บีบอัดรูปภาพอัตโนมัติ ประหยัดพื้นที่จัดเก็บ 95%" : "⚡ Auto-compresses site photos saving ~95% storage"}</span>
          </div>
        </div>
      </div>

      {/* Attachments Gallery Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {lang === "th" ? "รายการไฟล์ผลงาน & เอกสารส่งมอบ" : "Attached Deliverables & Files"} ({taskAttachments.length})
          </h4>
          <span className="text-[10px] text-muted-foreground">
            {lang === "th" ? "คลิกที่รูปเพื่อพรีวิวดูภาพขนาดเต็ม" : "Click image to open full preview"}
          </span>
        </div>

        {taskAttachments.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center italic border rounded-xl bg-card">
            {lang === "th"
              ? "ยังไม่มีไฟล์แนบส่งมอบผลงาน (สามารถอัปโหลดได้จากกล่องด้านบน)"
              : "No deliverables attached yet. Upload files from the box above."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {taskAttachments.map((file) => {
              const isImg = file.file_type === "image";

              return (
                <div
                  key={file.id}
                  className="rounded-xl border bg-card p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-2.5 group"
                >
                  {/* Preview Thumbnail for Images */}
                  {isImg ? (
                    <div
                      onClick={() => setPreviewAttachment(file)}
                      className="relative h-32 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer group-hover:opacity-90"
                    >
                      <img
                        src={file.thumbnail_url || file.file_url}
                        alt={file.file_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold">
                        <Eye className="h-4 w-4" />
                        <span>{lang === "th" ? "คลิกพรีวิวดูรูป" : "Preview"}</span>
                      </div>

                      {/* Compression savings badge */}
                      {file.saved_percent > 0 && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-600/90 text-white text-[9px] font-bold flex items-center gap-0.5 shadow-xs">
                          <Zap className="h-2.5 w-2.5" />
                          <span>-{file.saved_percent}%</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => setPreviewAttachment(file)}
                      className="h-32 rounded-lg bg-muted/40 border flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-muted/60"
                    >
                      {getFileIcon(file.file_type)}
                      <span className="text-[11px] font-semibold text-foreground uppercase">
                        {file.file_type} File
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {lang === "th" ? "คลิกเพื่อดูเอกสาร" : "Click to view document"}
                      </span>
                    </div>
                  )}

                  {/* Meta Details */}
                  <div className="space-y-1">
                    <div className="font-semibold text-xs text-foreground truncate" title={file.file_name}>
                      {file.file_name}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {file.compressed_size_kb < 1024
                          ? `${file.compressed_size_kb} KB`
                          : `${(file.compressed_size_kb / 1024).toFixed(1)} MB`}
                        {file.saved_percent > 0 && (
                          <span className="text-emerald-600 font-semibold ml-1">
                            ({lang === "th" ? `ประหยัด ${file.saved_percent}%` : `-${file.saved_percent}%`})
                          </span>
                        )}
                      </span>
                      <span>{file.uploader?.full_name?.split(" ")[0] || "Team"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewAttachment(file)}
                      className="h-7 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{lang === "th" ? "พรีวิว" : "Preview"}</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      <a
                        href={file.file_url}
                        download={file.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title={lang === "th" ? "ดาวน์โหลด" : "Download"}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </a>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAttachment(taskId, file.id)}
                        className="h-7 w-7 text-muted-foreground/60 hover:text-rose-600 hover:bg-rose-50"
                        title={lang === "th" ? "ลบไฟล์" : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Built-in Full-Screen Preview Modal */}
      {previewAttachment && (
        <div
          onClick={() => setPreviewAttachment(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border"
          >
            {/* Modal Header */}
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2 truncate pr-4">
                {getFileIcon(previewAttachment.file_type)}
                <span className="font-bold text-xs text-foreground truncate">
                  {previewAttachment.file_name}
                </span>
                {previewAttachment.saved_percent > 0 && (
                  <Badge variant="success" className="text-[10px] py-0">
                    ⚡ {lang === "th" ? `ประหยัด ${previewAttachment.saved_percent}%` : `-${previewAttachment.saved_percent}% optimized`}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.file_url}
                  download={previewAttachment.file_name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    <span>{lang === "th" ? "ดาวน์โหลด" : "Download"}</span>
                  </Button>
                </a>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewAttachment(null)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modal Body Preview */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/5 min-h-[300px]">
              {previewAttachment.file_type === "image" ? (
                <img
                  src={previewAttachment.file_url}
                  alt={previewAttachment.file_name}
                  className="max-h-[70vh] w-auto object-contain rounded-lg shadow-md"
                />
              ) : previewAttachment.file_type === "pdf" ? (
                <iframe
                  src={previewAttachment.file_url}
                  title={previewAttachment.file_name}
                  className="w-full h-[70vh] rounded-lg border"
                />
              ) : (
                <div className="text-center py-12 space-y-3">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    {lang === "th"
                      ? "ไฟล์ประเภทนี้ไม่รองรับการแสดงผลพรีวิวสด กรุณากดปุ่มดาวน์โหลดเพื่อเปิดดู"
                      : "Direct preview not supported for this file format. Click download to view."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
