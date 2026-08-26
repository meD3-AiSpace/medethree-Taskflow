// ====================================================================
// TaskFlow Manager — Workflow State Machine Engine (Section 4)
// Enforces strict state transitions and RBAC validations
// ====================================================================

import { Task, TaskStatus, UserRole } from "@/lib/types/database.types";

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

export interface TransitionContext {
  task: Task;
  targetStatus: TaskStatus;
  userRole: UserRole;
  userId: string;
  hasOutputCommentOrAttachment?: boolean;
  hasAssigneeAndDeadline?: boolean;
}

/**
 * Validates whether a state transition is legal according to Section 4 rules
 */
export function validateStateTransition(ctx: TransitionContext): ValidationResult {
  const { task, targetStatus, userRole, userId, hasOutputCommentOrAttachment, hasAssigneeAndDeadline } = ctx;
  const currentStatus = task.status;

  // If status is identical, no transition needed
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const isAssignee = task.assignees?.some((a) => a.id === userId) || false;
  const isAdminOrManager = userRole === 'admin' || userRole === 'manager';

  // 1. Transition: todo -> assigned
  if (currentStatus === 'todo' && targetStatus === 'assigned') {
    if (!isAdminOrManager) {
      return {
        allowed: false,
        reason: 'เฉพาะ Admin หรือ Manager/Supervisor เท่านั้นที่สามารถมอบหมายงานได้ (todo → assigned)',
      };
    }
    const hasAssignee = (task.assignees && task.assignees.length > 0) || hasAssigneeAndDeadline;
    const hasDeadline = !!task.deadline || hasAssigneeAndDeadline;
    if (!hasAssignee || !hasDeadline) {
      return {
        allowed: false,
        reason: 'ต้องระบุผู้รับผิดชอบ (Assignee) และกำหนดวันส่งมอบ (Deadline) ก่อนเปลี่ยนเป็นสถานะ assigned',
      };
    }
    return { allowed: true };
  }

  // 2. Transition: assigned -> in_progress (or todo -> in_progress for quick start by management/assignee)
  if (currentStatus === 'assigned' && targetStatus === 'in_progress') {
    if (!isAssignee && !isAdminOrManager) {
      return {
        allowed: false,
        reason: 'เฉพาะผู้รับผิดชอบงาน (Assignee) หรือ Manager/Admin เท่านั้นที่สามารถเริ่มงานได้ (assigned → in_progress)',
      };
    }
    return { allowed: true };
  }

  // Direct start from todo to in_progress (allowed if assignee or manager)
  if (currentStatus === 'todo' && targetStatus === 'in_progress') {
    if (!isAssignee && !isAdminOrManager) {
      return {
        allowed: false,
        reason: 'เฉพาะผู้รับผิดชอบงานหรือ Manager/Admin เท่านั้นที่เริ่มงานได้',
      };
    }
    return { allowed: true };
  }

  // 3. Transition: in_progress -> review
  if (currentStatus === 'in_progress' && targetStatus === 'review') {
    if (!isAssignee && !isAdminOrManager) {
      return {
        allowed: false,
        reason: 'เฉพาะผู้รับผิดชอบงานหรือ Manager/Admin เท่านั้นที่สามารถส่งงานเพื่อตรวจรับได้ (in_progress → review)',
      };
    }
    // Condition: Must have output (file or summary comment)
    const hasComments = (task.comments_count && task.comments_count > 0) || hasOutputCommentOrAttachment;
    if (!hasComments) {
      return {
        allowed: false,
        reason: 'ต้องมีบันทึกสรุปผลงาน (Comment) หรือแนบไฟล์ผลงานอย่างน้อย 1 รายการก่อนส่งตรวจรับ (Review)',
      };
    }
    return { allowed: true };
  }

  // 4. Transition: review -> completed (Sign off)
  if (currentStatus === 'review' && targetStatus === 'completed') {
    if (!isAdminOrManager) {
      return {
        allowed: false,
        reason: 'เฉพาะ Admin หรือ Manager/Supervisor เท่านั้นที่มีสิทธิ์ตรวจรับและปิดงาน (review → completed)',
      };
    }
    return { allowed: true };
  }

  // 5. Transition: review -> in_progress (Rejection / Revision)
  if (currentStatus === 'review' && targetStatus === 'in_progress') {
    if (!isAdminOrManager) {
      return {
        allowed: false,
        reason: 'เฉพาะ Admin หรือ Manager/Supervisor เท่านั้นที่มีสิทธิ์ตีกลับงานให้แก้ไข (review → in_progress)',
      };
    }
    return { allowed: true };
  }

  // 6. Direct transition to completed from in_progress allowed only by Admin/Manager
  if (currentStatus === 'in_progress' && targetStatus === 'completed') {
    if (!isAdminOrManager) {
      return {
        allowed: false,
        reason: 'เฉพาะ Admin หรือ Manager/Supervisor เท่านั้นที่สามารถปิดงานเสร็จสิ้นได้โดยตรง',
      };
    }
    return { allowed: true };
  }

  // Re-opening completed tasks (Admin only)
  if (currentStatus === 'completed') {
    if (userRole !== 'admin') {
      return {
        allowed: false,
        reason: 'งานที่ปิดเสร็จสมบูรณ์แล้ว สามารถเปิดใหม่ได้โดย Admin เท่านั้น',
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `ไม่อนุญาตให้เปลี่ยนสถานะจาก ${currentStatus} ไปยัง ${targetStatus}`,
  };
}
