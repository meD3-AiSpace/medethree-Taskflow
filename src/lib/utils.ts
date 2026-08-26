import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Language } from "@/lib/i18n/translations";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null, lang: Language = "th"): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

export function formatDateTime(dateString?: string | null, lang: Language = "th"): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString(lang === "th" ? "th-TH" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export function getStatusLabel(status: string, lang: Language = "th"): string {
  if (lang === "en") {
    switch (status) {
      case "todo":
        return "To Do";
      case "assigned":
        return "Assigned";
      case "in_progress":
        return "In Progress";
      case "review":
        return "Review";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  }

  switch (status) {
    case "todo":
      return "รอดำเนินการ (To Do)";
    case "assigned":
      return "มอบหมายแล้ว (Assigned)";
    case "in_progress":
      return "กำลังทำ (In Progress)";
    case "review":
      return "รอตรวจรับ (Review)";
    case "completed":
      return "เสร็จสิ้น (Completed)";
    default:
      return status;
  }
}

export function getPermitStatusLabel(status: string, lang: Language = "th"): string {
  if (lang === "en") {
    switch (status) {
      case "preparing":
        return "1. Preparing";
      case "submitted":
        return "2. Submitted";
      case "under_review":
        return "3. Under Review";
      case "needs_revision":
        return "4. Needs Revision";
      case "approved":
        return "5. Approved";
      case "rejected":
        return "6. Rejected";
      default:
        return status;
    }
  }

  switch (status) {
    case "preparing":
      return "1. เตรียมเอกสาร";
    case "submitted":
      return "2. ยื่นขอแล้ว";
    case "under_review":
      return "3. รอหน่วยงานพิจารณา";
    case "needs_revision":
      return "4. ติดปัญหา / รอแก้ไขตามคำสั่ง";
    case "approved":
      return "5. อนุมัติแล้ว";
    case "rejected":
      return "6. ถูกปฏิเสธ";
    default:
      return status;
  }
}

export function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800";
    case "high":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    case "medium":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "low":
      return "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function getPriorityLabel(priority: string, lang: Language = "th"): string {
  if (lang === "en") {
    switch (priority) {
      case "urgent":
        return "Urgent";
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "low":
        return "Low";
      default:
        return priority;
    }
  }

  switch (priority) {
    case "urgent":
      return "ด่วนที่สุด (Urgent)";
    case "high":
      return "ด่วน (High)";
    case "medium":
      return "ปกติ (Medium)";
    case "low":
      return "ต่ำ (Low)";
    default:
      return priority;
  }
}

export function getCategoryLabel(category: string, lang: Language = "th"): string {
  if (lang === "en") {
    switch (category) {
      case "design":
        return "Design";
      case "permit":
        return "Permit";
      case "site":
        return "Site / Build";
      case "other":
        return "Other";
      default:
        return category;
    }
  }

  switch (category) {
    case "design":
      return "งานออกแบบ (Design)";
    case "permit":
      return "ใบขออนุญาต (Permit)";
    case "site":
      return "งานหน้างาน (Site)";
    case "other":
      return "งานทั่วไป (Other)";
    default:
      return category;
  }
}
