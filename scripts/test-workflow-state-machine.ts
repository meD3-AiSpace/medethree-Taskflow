/**
 * TaskFlow Manager — Automated Workflow State Machine Verification Test Suite
 * Validates all 4 core rules and 9 boundary transition cases from Spec Section 4
 */

import { validateStateTransition } from "../src/lib/workflow/state-machine";
import { Task, UserRole } from "../src/lib/types/database.types";

interface TestCase {
  testId: string;
  ruleTitle: string;
  description: string;
  input: {
    task: Partial<Task>;
    targetStatus: any;
    userRole: UserRole;
    userId: string;
    hasOutputCommentOrAttachment: boolean;
    hasAssigneeAndDeadline: boolean;
  };
  expected: {
    allowed: boolean;
    reasonSubstring?: string;
  };
}

const mockAssignee = {
  id: "u-member-1",
  org_id: "11111111-1111-1111-1111-111111111111",
  full_name: "กานดา สถาปนิก",
  email: "designer@medtree.com",
  role: "member" as UserRole,
  created_at: new Date().toISOString(),
};

const testCases: TestCase[] = [
  {
    testId: "TEST-01",
    ruleTitle: "Rule 1 (Assignee & Deadline Mandatory)",
    description: "todo -> assigned WITHOUT assignee or deadline MUST be blocked",
    input: {
      task: { id: "t1", status: "todo", created_by: "u-mgr", assignees: [], deadline: null },
      targetStatus: "assigned",
      userRole: "manager",
      userId: "u-mgr",
      hasOutputCommentOrAttachment: false,
      hasAssigneeAndDeadline: false,
    },
    expected: {
      allowed: false,
      reasonSubstring: "ต้องระบุผู้รับผิดชอบ (Assignee) และกำหนดวันส่งมอบ (Deadline)",
    },
  },
  {
    testId: "TEST-02",
    ruleTitle: "Rule 1 (Assignee & Deadline Present)",
    description: "todo -> assigned WITH assignee and deadline MUST be allowed",
    input: {
      task: {
        id: "t1",
        status: "todo",
        created_by: "u-mgr",
        assignees: [mockAssignee],
        deadline: "2026-09-01T00:00:00Z",
      },
      targetStatus: "assigned",
      userRole: "manager",
      userId: "u-mgr",
      hasOutputCommentOrAttachment: false,
      hasAssigneeAndDeadline: true,
    },
    expected: {
      allowed: true,
    },
  },
  {
    testId: "TEST-03",
    ruleTitle: "Rule 2 (Output / Attachment Requirement)",
    description: "in_progress -> review WITHOUT deliverables/comments MUST be blocked",
    input: {
      task: {
        id: "t2",
        status: "in_progress",
        created_by: "u-mgr",
        assignees: [mockAssignee],
        comments_count: 0,
      },
      targetStatus: "review",
      userRole: "member",
      userId: "u-member-1",
      hasOutputCommentOrAttachment: false,
      hasAssigneeAndDeadline: true,
    },
    expected: {
      allowed: false,
      reasonSubstring: "ต้องมีบันทึกสรุปผลงาน (Comment) หรือแนบไฟล์ผลงาน",
    },
  },
  {
    testId: "TEST-04",
    ruleTitle: "Rule 2 (Output / Attachment Present)",
    description: "in_progress -> review WITH deliverable summary comment MUST be allowed",
    input: {
      task: {
        id: "t2",
        status: "in_progress",
        created_by: "u-mgr",
        assignees: [mockAssignee],
        comments_count: 1,
      },
      targetStatus: "review",
      userRole: "member",
      userId: "u-member-1",
      hasOutputCommentOrAttachment: true,
      hasAssigneeAndDeadline: true,
    },
    expected: {
      allowed: true,
    },
  },
  {
    testId: "TEST-05",
    ruleTitle: "Rule 3 (Role-Based Approval Authority)",
    description: "review -> completed attempted by MEMBER (Unauthorized) MUST be blocked",
    input: {
      task: {
        id: "t3",
        status: "review",
        created_by: "u-mgr",
        assignees: [mockAssignee],
        comments_count: 1,
      },
      targetStatus: "completed",
      userRole: "member",
      userId: "u-member-1",
      hasOutputCommentOrAttachment: true,
      hasAssigneeAndDeadline: true,
    },
    expected: {
      allowed: false,
      reasonSubstring: "เฉพาะ Admin หรือ Manager/Supervisor เท่านั้นที่มีสิทธิ์ตรวจรับและปิดงาน",
    },
  },
  {
    testId: "TEST-06",
    ruleTitle: "Rule 3 (Manager Sign-Off)",
    description: "review -> completed signed off by MANAGER / SUPERVISOR MUST be allowed",
    input: {
      task: {
        id: "t3",
        status: "review",
        created_by: "u-mgr",
        assignees: [mockAssignee],
        comments_count: 1,
      },
      targetStatus: "completed",
      userRole: "manager",
      userId: "u-mgr",
      hasOutputCommentOrAttachment: true,
      hasAssigneeAndDeadline: true,
    },
    expected: {
      allowed: true,
    },
  },
  {
    testId: "TEST-07",
    ruleTitle: "Rule 3 (Admin Sign-Off)",
    description: "review -> completed approved by ADMIN MUST be allowed",
    input: {
      task: {
        id: "t3",
        status: "review",
        created_by: "u-mgr",
        assignees: [mockAssignee],
        comments_count: 1,
      },
      targetStatus: "completed",
      userRole: "admin",
      userId: "u-admin",
      hasOutputCommentOrAttachment: true,
      hasAssigneeAndDeadline: true,
    },
    expected: {
      allowed: true,
    },
  },
  {
    testId: "TEST-08",
    ruleTitle: "Rule 4 (Invalid Sequence Jump)",
    description: "todo -> completed directly (Skipping execution/review) MUST be blocked",
    input: {
      task: {
        id: "t4",
        status: "todo",
        created_by: "u-admin",
        assignees: [],
        comments_count: 0,
      },
      targetStatus: "completed",
      userRole: "admin",
      userId: "u-admin",
      hasOutputCommentOrAttachment: false,
      hasAssigneeAndDeadline: false,
    },
    expected: {
      allowed: false,
      reasonSubstring: "ไม่อนุญาตให้เปลี่ยนสถานะจาก todo ไปยัง completed",
    },
  },
  {
    testId: "TEST-09",
    ruleTitle: "Rejection / Revision Workflow",
    description: "review -> in_progress (Manager rejects deliverable for rework) MUST be allowed",
    input: {
      task: {
        id: "t5",
        status: "review",
        created_by: "u-mgr",
        assignees: [mockAssignee],
        comments_count: 1,
      },
      targetStatus: "in_progress",
      userRole: "manager",
      userId: "u-mgr",
      hasOutputCommentOrAttachment: true,
      hasAssigneeAndDeadline: true,
    },
    expected: {
      allowed: true,
    },
  },
];

console.log("========================================================================");
console.log("   TASKFLOW MANAGER — WORKFLOW STATE MACHINE AUTOMATED AUDIT SUITE      ");
console.log("   Verifying Strict Section 4 Transition Rules & Role Boundaries       ");
console.log("========================================================================\n");

let passedCount = 0;
let failedCount = 0;
for (const tc of testCases) {
  const result = validateStateTransition({
    currentStatus: tc.input.task?.status || "todo",
    targetStatus: tc.input.targetStatus,
    deadlineSet: !!tc.input.task?.deadline || !!tc.input.hasAssigneeAndDeadline,
    assigneeIds: (tc.input.task?.assignees || []).map((a: any) => a.id),
    actorId: tc.input.userId || "u-1",
    actorRole: tc.input.userRole || "member",
    evidenceCount: (tc.input.task?.comments_count || 0) + (tc.input.hasOutputCommentOrAttachment ? 1 : 0),
  });

  const isAllowedMatch = result.allowed === tc.expected.allowed;
  const isReasonMatch = tc.expected.reasonSubstring
    ? (result.reason?.includes(tc.expected.reasonSubstring) || false)
    : true;

  if (isAllowedMatch && isReasonMatch) {
    passedCount++;
    console.log(`[PASS] ${tc.testId}: ${tc.ruleTitle}`);
    console.log(`       Scenario: ${tc.description}`);
    console.log(`       Result:   allowed=${result.allowed}${result.reason ? ` | reason="${result.reason}"` : ""}\n`);
  } else {
    failedCount++;
    console.error(`[FAIL] ${tc.testId}: ${tc.ruleTitle}`);
    console.error(`       Scenario: ${tc.description}`);
    console.error(`       Expected: allowed=${tc.expected.allowed}, reasonSubstring="${tc.expected.reasonSubstring}"`);
    console.error(`       Actual:   allowed=${result.allowed}, reason="${result.reason}"\n`);
  }
}

console.log("------------------------------------------------------------------------");
console.log(`AUDIT TEST SUMMARY: Total=${testCases.length} | Passed=${passedCount} | Failed=${failedCount}`);
console.log("------------------------------------------------------------------------");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log(">>> ALL 9 WORKFLOW TRANSITION TESTS PASSED STRICT COMPLIANCE CHECKS! <<<\n");
}
