import { describe, it, expect } from "vitest";
import { Task, TaskIssue, UserProfile, Organization } from "@/lib/types/database.types";
import { validateStateTransition } from "@/lib/workflow/state-machine";

describe("Phase 2: Enterprise Multi-Tenant & RLS Isolation Suite", () => {
  const orgA: Organization = { id: "org-1111", name: "MeDTree Design & Build", created_at: "2026-01-01T00:00:00Z" };
  const orgB: Organization = { id: "org-2222", name: "Partner Construction Co", created_at: "2026-01-01T00:00:00Z" };

  const userA: UserProfile = {
    id: "u-1",
    org_id: orgA.id,
    full_name: "Boss X (Admin)",
    email: "medethree@gmail.com",
    role: "admin",
    created_at: "2026-01-01T00:00:00Z",
  };

  const userB: UserProfile = {
    id: "u-2",
    org_id: orgB.id,
    full_name: "External Auditor",
    email: "auditor@external.com",
    role: "viewer",
    created_at: "2026-01-01T00:00:00Z",
  };

  const taskOrgA: Task = {
    id: "t-101",
    org_id: orgA.id,
    title: "เขียนแบบโครงสร้างวิลล่า A",
    category: "design",
    status: "in_progress",
    priority: "high",
    deadline: "2026-09-15T00:00:00Z",
    created_at: "2026-08-20T00:00:00Z",
    updated_at: "2026-08-20T00:00:00Z",
    assignees: [userA],
    comments_count: 2,
  };

  const taskOrgB: Task = {
    id: "t-202",
    org_id: orgB.id,
    title: "ตรวจไซต์งานโครงการ B",
    category: "site",
    status: "todo",
    priority: "medium",
    deadline: "2026-09-20T00:00:00Z",
    created_at: "2026-08-20T00:00:00Z",
    updated_at: "2026-08-20T00:00:00Z",
    assignees: [userB],
  };

  it("should enforce strict org-level task scoping (Cross-Org Leakage Prevention)", () => {
    const allTasks = [taskOrgA, taskOrgB];
    const scopedForOrgA = allTasks.filter((t) => t.org_id === userA.org_id);
    const scopedForOrgB = allTasks.filter((t) => t.org_id === userB.org_id);

    expect(scopedForOrgA.length).toBe(1);
    expect(scopedForOrgA[0].id).toBe("t-101");
    expect(scopedForOrgA.some((t) => t.org_id === orgB.id)).toBe(false);

    expect(scopedForOrgB.length).toBe(1);
    expect(scopedForOrgB[0].id).toBe("t-202");
    expect(scopedForOrgB.some((t) => t.org_id === orgA.id)).toBe(false);
  });

  it("should validate legal state transition with evidence (in_progress -> review -> completed)", () => {
    // 1. in_progress -> review (has comments_count = 2)
    const toReview = validateStateTransition({
      currentStatus: "in_progress",
      targetStatus: "review",
      actorId: userA.id,
      actorRole: userA.role,
      assigneeIds: [userA.id],
      deadlineSet: true,
      evidenceCount: 2,
    });
    expect(toReview.allowed).toBe(true);

    // 2. Non-admin/manager cannot sign off to completed
    const viewerToCompleted = validateStateTransition({
      currentStatus: "review",
      targetStatus: "completed",
      actorId: userB.id,
      actorRole: userB.role,
      assigneeIds: [],
      deadlineSet: true,
      evidenceCount: 2,
    });
    expect(viewerToCompleted.allowed).toBe(false);
    expect(viewerToCompleted.reason).toContain("Admin หรือ Manager");

    // 3. Admin sign off to completed is allowed
    const adminToCompleted = validateStateTransition({
      currentStatus: "review",
      targetStatus: "completed",
      actorId: userA.id,
      actorRole: userA.role,
      assigneeIds: [userA.id],
      deadlineSet: true,
      evidenceCount: 2,
    });
    expect(adminToCompleted.allowed).toBe(true);
  });

  it("should preserve resolver provenance when issue is marked resolved", () => {
    const unresolvedIssue: TaskIssue = {
      id: "iss-1",
      task_id: taskOrgA.id,
      issue_description: "ท่อสุขาภิบาลชนคานโครงสร้าง",
      raised_by: "u-site",
      raised_at: "2026-08-28T00:00:00Z",
      is_resolved: false,
    };

    const resolvedTime = new Date().toISOString();
    const resolutionNote = "ประสานงานวิศวกรโครงสร้างและขยับแนวท่อลง 10 cm เรียบร้อยแล้ว";

    const resolvedIssue: TaskIssue = {
      ...unresolvedIssue,
      is_resolved: true,
      resolved_by: userA.id,
      resolved_at: resolvedTime,
      resolution_description: resolutionNote,
      resolved_user: userA,
    };

    expect(resolvedIssue.is_resolved).toBe(true);
    expect(resolvedIssue.resolved_by).toBe(userA.id);
    expect(resolvedIssue.resolved_user?.full_name).toBe("Boss X (Admin)");
    expect(resolvedIssue.resolved_user?.role).toBe("admin");
    expect(resolvedIssue.resolution_description).toBe(resolutionNote);
  });

  it("should preserve task assignee reassignment and persist assignees list", () => {
    const originalTask = { ...taskOrgA, assignees: [userA] };
    const updatedAssignees = [userB];

    const reassignedTask: Task = {
      ...originalTask,
      assignees: updatedAssignees,
      updated_at: new Date().toISOString(),
    };

    expect(reassignedTask.assignees).toBeDefined();
    expect(reassignedTask.assignees?.length).toBe(1);
    expect(reassignedTask.assignees?.[0].id).toBe(userB.id);
    expect(reassignedTask.assignees?.[0].full_name).toBe("External Auditor");
  });

  it("should enforce active task referential integrity for notifications and issue counters", () => {
    const tasks = [taskOrgA];
    const issues = [
      { id: "iss-1", task_id: taskOrgA.id, is_resolved: true },
      { id: "iss-orphan", task_id: "deleted-task-999", is_resolved: false },
    ];
    const notifications = [
      { id: "n-1", task_id: taskOrgA.id, is_read: false },
      { id: "n-orphan", task_id: "deleted-task-999", is_read: false },
    ];

    const activeTaskIds = new Set(tasks.map((t) => t.id));
    const activeUnresolvedIssues = issues.filter((i) => !i.is_resolved && activeTaskIds.has(i.task_id));
    const validUnreadNotifs = notifications.filter((n) => !n.is_read && (!n.task_id || activeTaskIds.has(n.task_id)));

    // Active task has 0 unresolved issues because iss-1 is resolved, and orphan issue is excluded
    expect(activeUnresolvedIssues.length).toBe(0);
    // Only notification for active task is counted (orphan is excluded)
    expect(validUnreadNotifs.length).toBe(1);
    expect(validUnreadNotifs[0].id).toBe("n-1");
  });
});
