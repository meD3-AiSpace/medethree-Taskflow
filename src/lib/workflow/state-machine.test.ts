import { describe, it, expect } from "vitest";
import { validateStateTransition } from "./state-machine";

describe("Workflow State Machine (Strict Rules & RBAC)", () => {
  it("should allow same-status transitions (no-op)", () => {
    const result = validateStateTransition({
      currentStatus: "todo",
      targetStatus: "todo",
      deadlineSet: false,
      assigneeIds: [],
      actorId: "user-1",
      actorRole: "member",
      evidenceCount: 0,
    });
    expect(result.allowed).toBe(true);
  });

  describe("todo -> assigned", () => {
    it("should allow manager to assign with assignee and deadline", () => {
      const result = validateStateTransition({
        currentStatus: "todo",
        targetStatus: "assigned",
        deadlineSet: true,
        assigneeIds: ["user-2"],
        actorId: "manager-1",
        actorRole: "manager",
        evidenceCount: 0,
      });
      expect(result.allowed).toBe(true);
    });

    it("should reject member from assigning", () => {
      const result = validateStateTransition({
        currentStatus: "todo",
        targetStatus: "assigned",
        deadlineSet: true,
        assigneeIds: ["user-2"],
        actorId: "member-1",
        actorRole: "member",
        evidenceCount: 0,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("เฉพาะ Admin หรือ Manager/Supervisor");
    });

    it("should reject assignment without deadline", () => {
      const result = validateStateTransition({
        currentStatus: "todo",
        targetStatus: "assigned",
        deadlineSet: false,
        assigneeIds: ["user-2"],
        actorId: "manager-1",
        actorRole: "manager",
        evidenceCount: 0,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("กำหนดวันส่งมอบ");
    });
  });

  describe("assigned / in_progress -> review", () => {
    it("should allow assignee to submit for review when evidence exists", () => {
      const result = validateStateTransition({
        currentStatus: "in_progress",
        targetStatus: "review",
        deadlineSet: true,
        assigneeIds: ["user-1"],
        actorId: "user-1",
        actorRole: "member",
        evidenceCount: 1,
      });
      expect(result.allowed).toBe(true);
    });

    it("should reject review submission when zero evidence/comments attached", () => {
      const result = validateStateTransition({
        currentStatus: "in_progress",
        targetStatus: "review",
        deadlineSet: true,
        assigneeIds: ["user-1"],
        actorId: "user-1",
        actorRole: "member",
        evidenceCount: 0,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("ต้องมีบันทึกสรุปผลงาน");
    });
  });

  describe("review -> completed", () => {
    it("should allow manager to approve review into completed", () => {
      const result = validateStateTransition({
        currentStatus: "review",
        targetStatus: "completed",
        deadlineSet: true,
        assigneeIds: ["user-1"],
        actorId: "manager-1",
        actorRole: "manager",
        evidenceCount: 1,
      });
      expect(result.allowed).toBe(true);
    });

    it("should reject standard member from self-approving to completed", () => {
      const result = validateStateTransition({
        currentStatus: "review",
        targetStatus: "completed",
        deadlineSet: true,
        assigneeIds: ["user-1"],
        actorId: "user-1",
        actorRole: "member",
        evidenceCount: 1,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("เฉพาะ Admin หรือ Manager/Supervisor");
    });
  });

  describe("in_progress -> completed (Strict prohibition)", () => {
    it("should block direct skipping from in_progress to completed", () => {
      const result = validateStateTransition({
        currentStatus: "in_progress",
        targetStatus: "completed",
        deadlineSet: true,
        assigneeIds: ["user-1"],
        actorId: "admin-1",
        actorRole: "admin",
        evidenceCount: 2,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("ไม่อนุญาตให้ปิดงานข้ามขั้นตอน");
    });
  });
});
