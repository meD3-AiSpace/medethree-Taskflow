// ====================================================================
// Test Script: Workflow State Machine Rules & Validation
// Verifies Section 4 transition matrix
// ====================================================================

const { validateStateTransition } = require("../src/lib/workflow/state-machine.ts");

console.log("=== RUNNING WORKFLOW STATE MACHINE VALIDATION TESTS ===");

const sampleTask = {
  id: "task-test-1",
  org_id: "org-1",
  title: "แบบสถาปัตย์",
  status: "todo",
  priority: "medium",
  category: "design",
  created_by: "user-manager",
  deadline: "2026-09-01T00:00:00.000Z",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  assignees: [{ id: "user-member", full_name: "Member 1", email: "m1@test.com", role: "member", org_id: "org-1", created_at: "" }],
  comments_count: 0,
};

// Test 1: Member tries to change todo -> assigned (Must FAIL)
const test1 = validateStateTransition({
  task: sampleTask,
  targetStatus: "assigned",
  userRole: "member",
  userId: "user-member",
  hasAssigneeAndDeadline: true,
});
console.log("Test 1: Member assigning task (Should FAIL):", !test1.allowed ? "✅ PASS (Denied)" : "❌ FAIL");

// Test 2: Manager changes todo -> assigned with assignee & deadline (Must PASS)
const test2 = validateStateTransition({
  task: sampleTask,
  targetStatus: "assigned",
  userRole: "manager",
  userId: "user-manager",
  hasAssigneeAndDeadline: true,
});
console.log("Test 2: Manager assigning task with assignee (Should PASS):", test2.allowed ? "✅ PASS (Allowed)" : "❌ FAIL");

// Test 3: Member changes in_progress -> review WITHOUT output (Must FAIL)
const inProgressTask = { ...sampleTask, status: "in_progress", comments_count: 0 };
const test3 = validateStateTransition({
  task: inProgressTask,
  targetStatus: "review",
  userRole: "member",
  userId: "user-member",
  hasOutputCommentOrAttachment: false,
});
console.log("Test 3: Member sending in_progress -> review without output (Should FAIL):", !test3.allowed ? "✅ PASS (Denied)" : "❌ FAIL");

// Test 4: Member changes in_progress -> review WITH output (Must PASS)
const test4 = validateStateTransition({
  task: { ...inProgressTask, comments_count: 1 },
  targetStatus: "review",
  userRole: "member",
  userId: "user-member",
  hasOutputCommentOrAttachment: true,
});
console.log("Test 4: Member sending in_progress -> review with comment/output (Should PASS):", test4.allowed ? "✅ PASS (Allowed)" : "❌ FAIL");

// Test 5: Member tries to close review -> completed (Must FAIL)
const reviewTask = { ...sampleTask, status: "review", comments_count: 1 };
const test5 = validateStateTransition({
  task: reviewTask,
  targetStatus: "completed",
  userRole: "member",
  userId: "user-member",
});
console.log("Test 5: Member attempting review -> completed (Should FAIL):", !test5.allowed ? "✅ PASS (Denied)" : "❌ FAIL");

// Test 6: Manager completes review -> completed (Must PASS)
const test6 = validateStateTransition({
  task: reviewTask,
  targetStatus: "completed",
  userRole: "manager",
  userId: "user-manager",
});
console.log("Test 6: Manager approving review -> completed (Should PASS):", test6.allowed ? "✅ PASS (Allowed)" : "❌ FAIL");

console.log("=== ALL WORKFLOW UNIT TESTS EXECUTED ===");
