// ====================================================================
// TaskFlow Manager — Workflow State Machine Engine (Section 4 / T2)
// Enforces strict state transitions and server-side RBAC validations
// ====================================================================

import { Task, TaskStatus, UserRole } from "@/lib/types/database.types";

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

export interface ServerTransitionContext {
  currentStatus: TaskStatus;      // from DB row fetched BY the route
  targetStatus: TaskStatus;
  deadlineSet: boolean;           // !!row.deadline
  assigneeIds: string[];          // task_assignees rows
  actorId: string;
  actorRole: UserRole;
  evidenceCount: number;          // comments+attachments created AFTER status_changed_at
  task?: Task;
  userRole?: UserRole;
  userId?: string;
  hasOutputCommentOrAttachment?: boolean;
  hasAssigneeAndDeadline?: boolean;
}

export type TransitionContext = ServerTransitionContext;

/**
 * Validates whether a state transition is legal according to Section 4 rules
 */
export function validateStateTransition(ctx: ServerTransitionContext): ValidationResult {
  const currentStatus = ctx.currentStatus || ctx.task?.status;
  const targetStatus = ctx.targetStatus;
  const actorRole = ctx.actorRole || ctx.userRole || "member";
  const actorId = ctx.actorId || ctx.userId || "";
  
  const assigneeIds = ctx.assigneeIds || ctx.task?.assignees?.map((a) => a.id) || [];
  const deadlineSet = ctx.deadlineSet !== undefined ? ctx.deadlineSet : (!!ctx.task?.deadline || !!ctx.hasAssigneeAndDeadline);
  const evidenceCount = ctx.evidenceCount !== undefined ? ctx.evidenceCount : ((ctx.task?.comments_count || 0) + (ctx.hasOutputCommentOrAttachment ? 1 : 0));

  // If status is identical, no transition needed
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const isAssignee = assigneeIds.includes(actorId) || (ctx.task?.assignees?.some((a) => a.id === actorId) ?? false);
  const isAdminOrManager = actorRole === "admin" || actorRole === "manager";

  // 1. Transition: todo -> assigned
  if (currentStatus === "todo" && targetStatus === "assigned") {
    if (!isAdminOrManager) {
      return {
        allowed: false,
        reason: "เฉพาะ Admin หรือ Manager/Supervisor เท่านั้นที่สามารถมอบหมายงานได้ (todo → assigned)",
      };
    }
    if (assigneeIds.length === 0 || !deadlineSet) {
      return {
        allowed: false,
        reason: "ต้องระบุผู้รับผิดชอบ (Assignee) และกำหนดวันส่งมอบ (Deadline) ก่อนเปลี่ยนเป็นสถานะ assigned",
      };
    }
    return { allowed: true };
  }

  // 2. Transition: assigned -> in_progress
  if (currentStatus === "assigned" && targetStatus === "in_progress") {
    if (!isAssignee && !isAdminOrManager) {
      return {
        allowed: false,
        reason: "เฉพาะผู้รับผิดชอบงาน (Assignee) หรือ Manager/Admin เท่านั้นที่สามารถเริ่มงานได้ (assigned → in_progress)",
      };
    }
    return { allowed: true };
  }

  // Direct start from todo to in_progress (allowed if assignee or manager)
  if (currentStatus === "todo" && targetStatus === "in_progress") {
    if (!isAssignee && !isAdminOrManager) {
      return {
        allowed: false,
        reason: "เฉพาะผู้รับผิดชอบงานหรือ Manager/Admin เท่านั้นที่เริ่มงานได้",
      };
    }
    return { allowed: true };
  }

  // 3. Transition: in_progress -> review
  if (currentStatus === "in_progress" && targetStatus === "review") {
    if (!isAssignee && !isAdminOrManager) {
      return {
        allowed: false,
        reason: "เฉพาะผู้รับผิดชอบงานหรือ Manager/Admin เท่านั้นที่สามารถส่งงานเพื่อตรวจรับได้ (in_progress → review)",
      };
    }
    // Condition: Must have output (file or summary comment created after status change)
    if (evidenceCount <= 0) {
      return {
        allowed: false,
        reason: "ต้องมีบันทึกสรุปผลงาน (Comment) หรือแนบไฟล์ผลงานอย่างน้อย 1 รายการก่อนส่งตรวจรับ (Review)",
      };
    }
    return { allowed: true };
  }

  // 4. Transition: review -> completed (Sign off)
  if (currentStatus === "review" && targetStatus === "completed") {
    if (!isAdminOrManager) {
      return {
        allowed: false,
        reason: "เฉพาะ Admin หรือ Manager/Supervisor เท่านั้นที่มีสิทธิ์ตรวจรับและปิดงาน (review → completed)",
      };
    }
    return { allowed: true };
  }

  // 5. Transition: review -> in_progress (Rejection / Revision)
  if (currentStatus === "review" && targetStatus === "in_progress") {
    if (!isAdminOrManager) {
      return {
        allowed: false,
        reason: "เฉพาะ Admin หรือ Manager/Supervisor เท่านั้นที่มีสิทธิ์ตีกลับงานให้แก้ไข (review → in_progress)",
      };
    }
    return { allowed: true };
  }

  // 6. Transition in_progress -> completed strictly prohibited (Q2 decision)
  if (currentStatus === "in_progress" && targetStatus === "completed") {
    return {
      allowed: false,
      reason: "กรุณาส่งงานเข้าตรวจรับ (review) ก่อนปิดงาน — ไม่อนุญาตให้ปิดงานข้ามขั้นตอน",
    };
  }

  // Re-opening completed tasks (Admin only)
  if (currentStatus === "completed") {
    if (actorRole !== "admin") {
      return {
        allowed: false,
        reason: "งานที่ปิดเสร็จสมบูรณ์แล้ว สามารถเปิดใหม่ได้โดย Admin เท่านั้น",
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `ไม่อนุญาตให้เปลี่ยนสถานะจาก ${currentStatus} ไปยัง ${targetStatus}`,
  };
}
