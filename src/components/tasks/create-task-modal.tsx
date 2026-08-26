"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { TaskCategory, TaskPriority } from "@/lib/types/database.types";
import { translateText } from "@/lib/i18n/auto-translate";
import { FileCheck2, Sparkles, CheckCircle2 } from "lucide-react";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: TaskCategory;
  initialDeadline?: string;
}

export function CreateTaskModal({
  open,
  onOpenChange,
  defaultCategory = "design",
  initialDeadline = "",
}: CreateTaskModalProps) {
  const { createTask, projects, users } = useTaskStore();
  const { t, lang } = useLanguage();

  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [category, setCategory] = useState<TaskCategory>(defaultCategory);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [deadline, setDeadline] = useState(initialDeadline || "");
  const [assigneeId, setAssigneeId] = useState(users[0]?.id || "");

  // Sync initialDeadline whenever modal opens or date changes
  useEffect(() => {
    if (open) {
      if (initialDeadline) {
        setDeadline(initialDeadline);
      }
      if (projects.length > 0 && !projectId) {
        setProjectId(projects[0].id);
      }
      if (users.length > 0 && !assigneeId) {
        setAssigneeId(users[0].id);
      }
    }
  }, [open, initialDeadline, projects, users]);

  // Permit-specific fields (Section 3.8)
  const [permitType, setPermitType] = useState("ใบอนุญาตก่อสร้าง (อ.1)");
  const [permitTypeEn, setPermitTypeEn] = useState("Building Construction Permit (Form A.1)");
  const [authority, setAuthority] = useState("สำนักงานเขต / เทศบาล");
  const [authorityEn, setAuthorityEn] = useState("District Office / Municipality");
  const [targetApprovalDate, setTargetApprovalDate] = useState("");

  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedPreview, setTranslatedPreview] = useState(false);

  const handleAutoTranslate = async () => {
    if (!title.trim() && !description.trim()) return;
    setIsTranslating(true);

    if (title.trim()) {
      const resTitle = await translateText(title);
      setTitleEn(resTitle.translatedText);
    }
    if (description.trim()) {
      const resDesc = await translateText(description);
      setDescriptionEn(resDesc.translatedText);
    }
    if (authority.trim()) {
      const resAuth = await translateText(authority);
      setAuthorityEn(resAuth.translatedText);
    }

    setIsTranslating(false);
    setTranslatedPreview(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedAssignee = users.find((u) => u.id === assigneeId);

    await createTask(
      {
        title,
        title_en: titleEn || undefined,
        description,
        description_en: descriptionEn || undefined,
        project_id: projectId,
        category,
        priority,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        status: selectedAssignee && deadline ? "assigned" : "todo",
        assignees: selectedAssignee ? [selectedAssignee] : [],
      },
      category === "permit"
        ? {
            permit_type: permitType,
            permit_type_en: permitTypeEn,
            authority,
            authority_en: authorityEn,
            target_approval_date: targetApprovalDate || null,
            permit_status: "preparing",
          }
        : undefined
    );

    // Reset and close
    setTitle("");
    setTitleEn("");
    setDescription("");
    setDescriptionEn("");
    setTranslatedPreview(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {category === "permit" && <FileCheck2 className="h-5 w-5 text-emerald-600" />}
              <span>{t("createTaskBtn")}</span>
            </DialogTitle>

            {/* Auto Translate Button in Form */}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAutoTranslate}
              disabled={isTranslating || (!title.trim() && !description.trim())}
              className="text-xs h-7 gap-1.5 border-emerald-500/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 shadow-xs"
            >
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>{isTranslating ? (lang === "th" ? "กำลังแปลด้วย AI..." : "Translating...") : (lang === "th" ? "✨ แปลเป็นอังกฤษ (AI)" : "✨ AI Translate")}</span>
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-semibold mb-1">
              {t("tableTitle")} <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={lang === "th" ? "ระบุชื่องานที่ชัดเจน..." : "Specify clear task title..."}
              className="text-xs"
            />
            {translatedPreview && titleEn && (
              <div className="mt-1.5 p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                <span className="text-emerald-800 dark:text-emerald-300 font-semibold block mb-0.5">
                  🇬🇧 English (Auto-translated):
                </span>
                <Input
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="text-xs bg-background h-7"
                />
              </div>
            )}
          </div>

          {/* Category & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">{t("allCategories")}</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="text-xs"
              >
                <option value="design">{t("catDesign")}</option>
                <option value="permit">{t("catPermit")}</option>
                <option value="site">{t("catSite")}</option>
                <option value="other">{t("catOther")}</option>
              </Select>
            </div>

            <div>
              <label className="block font-semibold mb-1">{t("projectLabel")}</label>
              <Select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="text-xs"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {lang === "en" && p.name_en ? p.name_en : p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Permit-Specific Section (Section 3.8) */}
          {category === "permit" && (
            <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                <FileCheck2 className="h-4 w-4" />
                <span>{t("tabPermit")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-muted-foreground">{t("tabPermit")}</label>
                  <Select
                    value={permitType}
                    onChange={(e) => setPermitType(e.target.value)}
                    className="text-xs bg-background"
                  >
                    <option value="ใบอนุญาตก่อสร้าง (อ.1)">ใบอนุญาตก่อสร้าง (อ.1) / Building Permit (A.1)</option>
                    <option value="ใบอนุญาตดัดแปลงอาคาร">ใบอนุญาตดัดแปลงอาคาร / Renovation Permit</option>
                    <option value="รายงานผลกระทบสิ่งแวดล้อม (EIA)">รายงานผลกระทบสิ่งแวดล้อม (EIA)</option>
                    <option value="ใบรับรองการก่อสร้าง (อ.6)">ใบรับรองการก่อสร้าง (อ.6) / Occupancy Cert (A.6)</option>
                    <option value="ขอเชื่อมทางสาธารณะ">ขอเชื่อมทางสาธารณะ / Public Connection</option>
                  </Select>
                </div>
                <div>
                  <label className="block font-medium mb-1 text-muted-foreground">{t("authorityLabel")}</label>
                  <Input
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                    placeholder={lang === "th" ? "เช่น สนง.เขตวัฒนา, อบต.บางพลี" : "e.g. District Office, Municipality"}
                    className="text-xs bg-background"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium mb-1 text-muted-foreground">{t("targetApprovalDateLabel")}</label>
                  <Input
                    type="date"
                    value={targetApprovalDate}
                    onChange={(e) => setTargetApprovalDate(e.target.value)}
                    className="text-xs bg-background"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Priority, Assignee & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">{t("tablePriority")}</label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="text-xs"
              >
                <option value="low">{t("pLow")}</option>
                <option value="medium">{t("pMedium")}</option>
                <option value="high">{t("pHigh")}</option>
                <option value="urgent">{t("pUrgent")}</option>
              </Select>
            </div>

            <div>
              <label className="block font-semibold mb-1">{t("tableAssignee")}</label>
              <Select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="text-xs"
              >
                <option value="">-- {t("unassigned")} --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block font-semibold mb-1">{t("tableDeadline")}</label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold mb-1">{t("descriptionTitle")}</label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={lang === "th" ? "ระบุขอบเขตงาน รายละเอียดข้อกำหนด..." : "Describe task scope and deliverables..."}
              className="text-xs"
            />
            {translatedPreview && descriptionEn && (
              <div className="mt-1.5 p-2 rounded bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                <span className="text-emerald-800 dark:text-emerald-300 font-semibold block mb-0.5">
                  🇬🇧 English Description (Auto-translated):
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {t("cancelEdit")}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {t("createTaskBtn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
