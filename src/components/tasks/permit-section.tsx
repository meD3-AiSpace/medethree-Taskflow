"use client";

import React, { useState } from "react";
import { Task, PermitStatus } from "@/lib/types/database.types";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FileCheck2, Building2, Calendar, RefreshCcw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { formatDate, getPermitStatusLabel } from "@/lib/utils";

interface PermitSectionProps {
  task: Task;
}

export function PermitSection({ task }: PermitSectionProps) {
  const { updatePermitStatus, updatePermitDetails } = useTaskStore();
  const { t, lang } = useLanguage();
  const permit = task.permit_details;

  const [isEditing, setIsEditing] = useState(false);
  const [authority, setAuthority] = useState(permit?.authority || "");
  const [permitType, setPermitType] = useState(permit?.permit_type || "");
  const [submittedDate, setSubmittedDate] = useState(permit?.submitted_date || "");
  const [targetDate, setTargetDate] = useState(permit?.target_approval_date || "");

  if (!permit) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-xs">
        {lang === "th" ? "งานนี้ไม่ได้อยู่ในหมวดหมู่ 'ใบขออนุญาต'" : "This task is not in the 'Permit' category"}
      </div>
    );
  }

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updatePermitDetails(task.id, {
      authority,
      permit_type: permitType,
      submitted_date: submittedDate || null,
      target_approval_date: targetDate || null,
    });
    setIsEditing(false);
  };

  const permitStatuses: Array<{ status: PermitStatus; label: string; icon: React.ElementType; color: string }> = [
    { status: "preparing", label: t("pstPreparing"), icon: FileCheck2, color: "text-slate-600 bg-slate-100 dark:bg-slate-900 border-slate-300" },
    { status: "submitted", label: t("pstSubmitted"), icon: Building2, color: "text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-300" },
    { status: "under_review", label: t("pstUnderReview"), icon: Calendar, color: "text-amber-600 bg-amber-50 dark:bg-amber-950 border-amber-300" },
    { status: "needs_revision", label: t("pstNeedsRevision"), icon: AlertTriangle, color: "text-rose-700 bg-rose-50 dark:bg-rose-950 border-rose-300 animate-pulse" },
    { status: "approved", label: t("pstApproved"), icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 border-emerald-300" },
    { status: "rejected", label: t("pstRejected"), icon: XCircle, color: "text-red-700 bg-red-50 dark:bg-red-950 border-red-300" },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-4 rounded-xl border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold">{permit.permit_type}</h3>
          </div>

          {/* Automatic Revision Counter Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-semibold border border-amber-300 flex items-center gap-1.5">
              <RefreshCcw className="h-3 w-3 text-amber-600" />
              {t("permitRevCount", { count: permit.revision_round })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs h-7"
            >
              {isEditing ? t("cancelEdit") : t("editPermit")}
            </Button>
          </div>
        </div>

        {/* Status Lifecycle Selector */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2">
            {t("permitLifecycle")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {permitStatuses.map((item) => {
              const isCurrent = permit.permit_status === item.status;
              const Icon = item.icon;
              return (
                <button
                  key={item.status}
                  type="button"
                  onClick={() => updatePermitStatus(task.id, item.status)}
                  className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                    isCurrent
                      ? `${item.color} ring-2 ring-emerald-600 font-bold shadow-sm`
                      : "bg-muted/30 hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {isCurrent && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded">{t("currentBadge")}</span>}
                  </div>
                  <span className="text-[11px] leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail Form / View */}
        {isEditing ? (
          <form onSubmit={handleSaveDetails} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t text-xs">
            <div>
              <label className="block font-semibold mb-1">{t("tabPermit")}</label>
              <Input value={permitType} onChange={(e) => setPermitType(e.target.value)} className="text-xs" />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t("authorityLabel")}</label>
              <Input value={authority} onChange={(e) => setAuthority(e.target.value)} className="text-xs" />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t("submittedDateLabel")}</label>
              <Input type="date" value={submittedDate} onChange={(e) => setSubmittedDate(e.target.value)} className="text-xs" />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t("targetApprovalDateLabel")}</label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="text-xs" />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>{t("cancelEdit")}</Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">{t("saveBtn")}</Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t text-xs">
            <div className="p-2.5 rounded-lg bg-muted/40">
              <span className="text-muted-foreground text-[10px] block">{t("authorityLabel")}</span>
              <strong className="text-foreground text-xs">{permit.authority || "-"}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40">
              <span className="text-muted-foreground text-[10px] block">{t("submittedDateLabel")}</span>
              <strong className="text-foreground text-xs">{formatDate(permit.submitted_date, lang)}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40">
              <span className="text-muted-foreground text-[10px] block">{t("targetApprovalDateLabel")}</span>
              <strong className="text-foreground text-xs">{formatDate(permit.target_approval_date, lang)}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40">
              <span className="text-muted-foreground text-[10px] block">{t("currentPermitStatus")}</span>
              <strong className="text-emerald-700 dark:text-emerald-400 text-xs">{getPermitStatusLabel(permit.permit_status, lang)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
