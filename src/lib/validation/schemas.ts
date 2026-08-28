import { z } from "zod";

// ====================================================================
// Lighthouse TaskFlow v2.1 — Central Zod Validation Schemas (P1-1)
// ====================================================================

export const TaskStatusEnum = z.enum(["todo", "assigned", "in_progress", "review", "completed"]);
export const TaskPriorityEnum = z.enum(["low", "medium", "high", "urgent"]);
export const TaskCategoryEnum = z.enum(["design", "permit", "structure", "mep", "interior", "landscape", "inspection"]);
export const PermitStatusEnum = z.enum(["preparing", "submitted", "under_review", "needs_revision", "approved", "rejected"]);
export const LanguageEnum = z.enum(["th", "en"]);

// 1. Task State Transition Schema (T1 - Clean minimal schema)
export const TransitionSchema = z.object({ targetStatus: TaskStatusEnum });

// 2. Issue / Blocker Schema
export const AddIssueSchema = z.object({
  taskId: z.string().min(1).max(100),
  description: z.string().trim().min(1, "กรุณาระบุรายละเอียดปัญหา").max(500, "รายละเอียดปัญหายาวเกินกำหนด (สูงสุด 500 ตัวอักษร)"),
  descriptionEn: z.string().trim().max(500).optional(),
});

export const ResolveIssueSchema = z.object({
  issueId: z.string().min(1).max(100),
  resolution: z.string().trim().min(1, "กรุณาระบุแนวทางแก้ไขปัญหา").max(1000, "แนวทางแก้ไขยาวเกินกำหนด (สูงสุด 1,000 ตัวอักษร)"),
  resolutionEn: z.string().trim().max(1000).optional(),
});

// 3. Comment Schema
export const CommentSchema = z.object({
  taskId: z.string().min(1).max(100),
  text: z.string().trim().min(1, "กรุณาระบุข้อความความคิดเห็น").max(2000, "ข้อความยาวเกินกำหนด (สูงสุด 2,000 ตัวอักษร)"),
  contentEn: z.string().trim().max(2000).optional(),
  attachments: z.array(z.string().max(255)).max(10, "แนบไฟล์ได้สูงสุด 10 ไฟล์").optional(),
});

// 4. Translate Schema (Hardened)
export const TranslateSchema = z.object({
  text: z.string().trim().min(1, "กรุณาระบุข้อความที่ต้องการแปล").max(1500, "ข้อความยาวเกินกำหนด (สูงสุด 1,500 ตัวอักษร)"),
  context: z.string().max(100).optional().default("architecture_construction"),
});

// 5. LINE Test Push Schema
export const LineTestPushSchema = z.object({
  lineUserId: z.string().trim().min(10, "LINE User ID สั้นเกินไป").max(60, "LINE User ID ยาวเกินไป"),
  title: z.string().trim().max(150).optional(),
  message: z.string().trim().max(1000).optional(),
  taskTitle: z.string().trim().max(200).optional(),
  taskId: z.string().trim().max(100).optional(),
});

// 6. Reports Briefing Schema
export const ReportsBriefingSchema = z.object({
  periodLabel: z.string().trim().min(1).max(100),
  tasksCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  completedTitles: z.string().max(2000).optional().default(""),
  blockersList: z.string().max(2000).optional().default(""),
  totalHours: z.string().max(20).optional().default("0"),
  lang: LanguageEnum.optional().default("th"),
});

// Helper for formatting Zod validation errors strictly
export function formatZodError(error: unknown): string {
  if (!error) return "Invalid input";
  if (error instanceof z.ZodError) {
    return error.issues.map((e) => `${e.path.length > 0 ? e.path.join(".") + ": " : ""}${e.message}`).join(", ");
  }
  if (typeof error === "object" && error !== null && "issues" in error && Array.isArray((error as { issues: unknown[] }).issues)) {
    const issues = (error as { issues: Array<{ path?: string[]; message?: string }> }).issues;
    return issues.map((e) => `${e.path && e.path.length > 0 ? e.path.join(".") + ": " : ""}${e.message || "Invalid"}`).join(", ");
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Validation failed";
}
