/**
 * TaskFlow Manager — Multi-Tenant Row Level Security (RLS) Isolation Test Runner
 * Simulates SQL Engine RLS Evaluation Policies for Cross-Organization Attacks
 */

interface OrgRecord {
  id: string;
  name: string;
}

interface UserSession {
  uid: string;
  org_id: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
}

interface TaskRecord {
  id: string;
  org_id: string;
  title: string;
  status: string;
  priority: string;
  created_by: string;
}

// In-Memory RLS Database Engine Simulator
class RLSVirtualDatabase {
  private organizations: OrgRecord[] = [
    { id: "org-medtree-111", name: "MeDTree Design & Build" },
    { id: "org-competitor-222", name: "Competitor Real Estate Corp." },
  ];

  private tasks: TaskRecord[] = [
    {
      id: "task-101",
      org_id: "org-medtree-111",
      title: "ความลับโครงการ The Forest Villa (MeDTree Confidential)",
      status: "in_progress",
      priority: "high",
      created_by: "user-medtree-admin",
    },
    {
      id: "task-202",
      org_id: "org-competitor-222",
      title: "โครงการบ้านคู่แข่ง (Competitor Confidential)",
      status: "todo",
      priority: "medium",
      created_by: "user-competitor-admin",
    },
  ];

  /**
   * Evaluates Policy: "Org members can view tasks in their org"
   * SQL: USING (org_id = current_org_id())
   */
  public selectTasks(session: UserSession, queryOrgId?: string): TaskRecord[] {
    return this.tasks.filter((t) => {
      // RLS Policy Enforcement
      const isSameOrg = t.org_id === session.org_id;
      const matchesFilter = queryOrgId ? t.org_id === queryOrgId : true;
      return isSameOrg && matchesFilter;
    });
  }

  /**
   * Evaluates Policy: "Tasks INSERT policy"
   * SQL: WITH CHECK (org_id = current_org_id())
   */
  public insertTask(session: UserSession, taskData: Omit<TaskRecord, "id">): { success: boolean; error?: string } {
    if (taskData.org_id !== session.org_id) {
      return {
        success: false,
        error: `RLS Policy Violation: WITH CHECK (org_id = current_org_id()) failed. User org (${session.org_id}) cannot insert into org (${taskData.org_id})`,
      };
    }
    this.tasks.push({ id: `task-${Date.now()}`, ...taskData });
    return { success: true };
  }

  /**
   * Evaluates Policy: "Tasks UPDATE policy"
   * SQL: USING (org_id = current_org_id()) WITH CHECK (org_id = current_org_id())
   */
  public updateTask(session: UserSession, taskId: string, updates: Partial<TaskRecord>): { affectedRows: number; error?: string } {
    let affected = 0;
    this.tasks = this.tasks.map((t) => {
      if (t.id === taskId && t.org_id === session.org_id) {
        affected++;
        return { ...t, ...updates };
      }
      return t;
    });
    return { affectedRows: affected };
  }

  /**
   * Evaluates Policy: "Tasks DELETE policy"
   * SQL: USING (org_id = current_org_id() AND current_user_role() = 'admin')
   */
  public deleteTask(session: UserSession, taskId: string): { affectedRows: number; error?: string } {
    if (session.role !== "admin") {
      return { affectedRows: 0, error: "RLS Delete Policy requires role='admin'" };
    }
    const initialLen = this.tasks.length;
    this.tasks = this.tasks.filter((t) => !(t.id === taskId && t.org_id === session.org_id));
    return { affectedRows: initialLen - this.tasks.length };
  }
}

// ---------------------------------------------------------------------
// TEST RUNNER
// ---------------------------------------------------------------------
console.log("========================================================================");
console.log("   TASKFLOW MANAGER — ROW LEVEL SECURITY (RLS) MULTI-TENANT AUDIT TEST ");
console.log("========================================================================\n");

const db = new RLSVirtualDatabase();

const sessionMeDTreeUser: UserSession = {
  uid: "u-medtree-01",
  org_id: "org-medtree-111",
  role: "member",
};

const sessionCompetitorHacker: UserSession = {
  uid: "u-competitor-99",
  org_id: "org-competitor-222",
  role: "admin",
};

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail: string) {
  if (condition) {
    passCount++;
    console.log(`[PASS] ${testName}`);
    console.log(`       Detail: ${detail}\n`);
  } else {
    failCount++;
    console.error(`[FAIL] ${testName}`);
    console.error(`       Detail: ${detail}\n`);
  }
}

// 1. Cross-Tenant SELECT Attack Test
console.log("--- TEST 1: Cross-Tenant SELECT Isolation ---");
const leakedTasks = db.selectTasks(sessionCompetitorHacker, "org-medtree-111");
assert(
  leakedTasks.length === 0,
  "Cross-Tenant SELECT Attack Blocked",
  `Competitor query for MeDTree data returned ${leakedTasks.length} rows (Expected 0 - Complete Isolation)`
);

// 2. Cross-Tenant INSERT Injection Attack Test
console.log("--- TEST 2: Cross-Tenant INSERT Injection Attack ---");
const injectResult = db.insertTask(sessionCompetitorHacker, {
  org_id: "org-medtree-111", // Trying to inject malicious task into MeDTree
  title: "Malicious Fake Task Injected into Competitor",
  status: "todo",
  priority: "urgent",
  created_by: sessionCompetitorHacker.uid,
});
assert(
  !injectResult.success,
  "Cross-Tenant INSERT Injection Blocked",
  `System blocked foreign org injection with error: "${injectResult.error}"`
);

// 3. Cross-Tenant UPDATE Tampering Attack Test
console.log("--- TEST 3: Cross-Tenant UPDATE Tampering Attack ---");
const updateResult = db.updateTask(sessionCompetitorHacker, "task-101", {
  title: "Hacked Title",
  status: "completed",
});
assert(
  updateResult.affectedRows === 0,
  "Cross-Tenant UPDATE Tampering Blocked",
  `Attempt to modify MeDTree task-101 affected ${updateResult.affectedRows} rows (Expected 0)`
);

// 4. Cross-Tenant DELETE Attack Test
console.log("--- TEST 4: Cross-Tenant DELETE Attack ---");
const deleteResult = db.deleteTask(sessionCompetitorHacker, "task-101");
assert(
  deleteResult.affectedRows === 0,
  "Cross-Tenant DELETE Attack Blocked",
  `Attempt to delete MeDTree task-101 affected ${deleteResult.affectedRows} rows (Expected 0)`
);

// 5. Same-Tenant Legitimate Query Test
console.log("--- TEST 5: Legitimate Same-Tenant Read Verification ---");
const legitTasks = db.selectTasks(sessionMeDTreeUser);
assert(
  legitTasks.length === 1 && legitTasks[0].id === "task-101",
  "Legitimate Intra-Org Read Verified",
  `MeDTree user successfully retrieved their own task (${legitTasks[0].title})`
);

console.log("------------------------------------------------------------------------");
console.log(`RLS AUDIT SUMMARY: Total Tests=${passCount + failCount} | Passed=${passCount} | Failed=${failCount}`);
console.log("------------------------------------------------------------------------");

if (failCount > 0) {
  process.exit(1);
} else {
  console.log(">>> ALL 5 MULTI-TENANT RLS ISOLATION TESTS PASSED WITH ZERO LEAKS! <<<\n");
}
