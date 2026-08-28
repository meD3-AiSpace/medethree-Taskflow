import { describe, it, expect } from "vitest";
import {
  TaskStatusEnum,
  TaskPriorityEnum,
  TaskCategoryEnum,
  AddIssueSchema,
  ResolveIssueSchema,
  CommentSchema,
  TranslateSchema,
  ReportsBriefingSchema,
  formatZodError,
} from "./schemas";

describe("Validation Schemas Suite (Zero Loose Types)", () => {
  describe("Enums", () => {
    it("should accept valid task statuses", () => {
      expect(TaskStatusEnum.safeParse("todo").success).toBe(true);
      expect(TaskStatusEnum.safeParse("assigned").success).toBe(true);
      expect(TaskStatusEnum.safeParse("in_progress").success).toBe(true);
      expect(TaskStatusEnum.safeParse("review").success).toBe(true);
      expect(TaskStatusEnum.safeParse("completed").success).toBe(true);
      expect(TaskStatusEnum.safeParse("invalid_status").success).toBe(false);
    });

    it("should accept valid task priorities", () => {
      expect(TaskPriorityEnum.safeParse("low").success).toBe(true);
      expect(TaskPriorityEnum.safeParse("medium").success).toBe(true);
      expect(TaskPriorityEnum.safeParse("high").success).toBe(true);
      expect(TaskPriorityEnum.safeParse("urgent").success).toBe(true);
      expect(TaskPriorityEnum.safeParse("super_urgent").success).toBe(false);
    });

    it("should accept valid categories", () => {
      expect(TaskCategoryEnum.safeParse("design").success).toBe(true);
      expect(TaskCategoryEnum.safeParse("permit").success).toBe(true);
      expect(TaskCategoryEnum.safeParse("structure").success).toBe(true);
      expect(TaskCategoryEnum.safeParse("mep").success).toBe(true);
      expect(TaskCategoryEnum.safeParse("interior").success).toBe(true);
      expect(TaskCategoryEnum.safeParse("landscape").success).toBe(true);
      expect(TaskCategoryEnum.safeParse("inspection").success).toBe(true);
    });
  });

  describe("AddIssueSchema", () => {
    it("should validate a valid issue payload", () => {
      const valid = {
        taskId: "task-123",
        description: "ผนังชั้น 2 พบรอยแตกร้าวบริเวณมุมหน้าต่าง",
        descriptionEn: "Cracks found on 2nd floor window corner",
      };
      const result = AddIssueSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty description", () => {
      const invalid = {
        taskId: "task-123",
        description: "   ",
      };
      const result = AddIssueSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(formatZodError(result.error)).toContain("กรุณาระบุรายละเอียดปัญหา");
      }
    });
  });

  describe("CommentSchema", () => {
    it("should validate comments with attachments", () => {
      const comment = {
        taskId: "task-123",
        text: "ตรวจสอบแบบวิศวกรรมโครงสร้างเรียบร้อยแล้ว",
        attachments: ["https://supabase.co/storage/drawing1.pdf"],
      };
      const result = CommentSchema.safeParse(comment);
      expect(result.success).toBe(true);
    });

    it("should reject more than 10 attachments", () => {
      const comment = {
        taskId: "task-123",
        text: "ตรวจหลายไฟล์",
        attachments: Array(11).fill("https://supabase.co/file.pdf"),
      };
      const result = CommentSchema.safeParse(comment);
      expect(result.success).toBe(false);
    });
  });

  describe("ReportsBriefingSchema", () => {
    it("should validate executive KPI parameters", () => {
      const report = {
        periodLabel: "สัปดาห์ที่ 34 (2026)",
        tasksCount: 45,
        completedCount: 38,
        completedTitles: "Villa A Roof, Villa B Foundations",
        blockersList: "Waiting on municipal permit",
        totalHours: "185.5",
        lang: "th",
      };
      const result = ReportsBriefingSchema.safeParse(report);
      expect(result.success).toBe(true);
    });
  });
});
