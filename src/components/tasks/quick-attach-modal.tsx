"use client";

import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Task } from "@/lib/types/database.types";
import { compressImageFile } from "@/lib/utils/image-compressor";
import {
  Upload,
  Paperclip,
  CheckCircle2,
  Zap,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Layers,
  Sparkles,
} from "lucide-react";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

interface QuickAttachModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAttachModal({ task, open, onOpenChange }: QuickAttachModalProps) {
  const { addAttachment, currentUser } = useTaskStore();
  const { t, lang } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0);
  const [totalSavedPercent, setTotalSavedPercent] = useState(0);
  const [success, setSuccess] = useState(false);

  if (!task) return null;

  const displayTitle = getLocalizedDynamicText(task.title, task.title_en, lang);

  const handleProcessFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      let savedPercentsSum = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Automatic Client-Side Image Compression
        const result = await compressImageFile(file);
        savedPercentsSum += result.saved_percent;

        addAttachment(task.id, {
          task_id: task.id,
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

      setUploadedFilesCount(files.length);
      setTotalSavedPercent(Math.round(savedPercentsSum / files.length));
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setUploadedFilesCount(0);
        onOpenChange(false);
      }, 1800);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-2 pr-6">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <Paperclip className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {lang === "th" ? "แนบไฟล์ผลงาน & เอกสารส่งมอบ" : "Attach Deliverable Files"}
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
              {lang === "th" ? `อัปโหลดไฟล์ผลงาน ${uploadedFilesCount} ไฟล์เรียบร้อย!` : `Uploaded ${uploadedFilesCount} files successfully!`}
            </h3>
            {totalSavedPercent > 0 && (
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-center gap-1">
                <Zap className="h-3.5 w-3.5" />
                <span>{lang === "th" ? `บีบอัดรูปภาพประหยัดพื้นที่จัดเก็บได้ ${totalSavedPercent}%` : `Compressed & saved ${totalSavedPercent}% storage space`}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Drag & Drop Box */}
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
                        : "⚡ Optimizing and uploading files..."
                      : lang === "th"
                      ? "คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่"
                      : "Click to choose files or drag & drop here"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === "th"
                      ? "รองรับรูปภาพ JPG/PNG, แบบแปลน PDF/DWG, ตาราง Excel/BOQ"
                      : "Supports JPG/PNG photos, PDF/DWG drawings, Excel BOQ sheets"}
                  </p>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-semibold">
                  <Zap className="h-3 w-3 text-emerald-600" />
                  <span>{lang === "th" ? "บีบอัดรูปภาพอัตโนมัติ ประหยัดเนื้อที่ 95%" : "Auto-compression reduces ~95% size"}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                {lang === "th" ? "ปิดหน้าต่าง" : "Close"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
