import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, index, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ====================================================================
// Medethree Unified Ecosystem — Drizzle ORM Schema
// ====================================================================

// 1. Organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Teams / Departments
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. User Profiles & RBAC
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(), // Matches auth.users.id
  orgId: uuid("org_id").references(() => organizations.id).notNull(),
  teamId: uuid("team_id").references(() => teams.id),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("member"), // 'admin' | 'manager' | 'member' | 'viewer' | 'qc_inspector'
  lineUserId: varchar("line_user_id", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  notificationPreferences: jsonb("notification_preferences").default({
    notify_assignment: true,
    notify_blocker: true,
    notify_review: true,
    notify_deadline: true,
    notify_line: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Projects (Ecosystem-wide: TaskFlow + QC Villa + ERM)
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  teamId: uuid("team_id").references(() => teams.id),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  code: varchar("code", { length: 50 }),
  location: text("location"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    orgIdx: index("projects_org_idx").on(table.orgId),
  };
});

// 5. Tasks (TaskFlow Core)
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }),
  description: text("description"),
  descriptionEn: text("description_en"),
  category: varchar("category", { length: 50 }).notNull().default("design"),
  status: varchar("status", { length: 50 }).notNull().default("todo"),
  priority: varchar("priority", { length: 50 }).notNull().default("medium"),
  deadline: timestamp("deadline", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => userProfiles.id),
  statusChangedAt: timestamp("status_changed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    orgIdx: index("tasks_org_idx").on(table.orgId),
    projectIdx: index("tasks_project_idx").on(table.projectId),
    statusIdx: index("tasks_status_idx").on(table.status),
  };
});

// 6. Task Assignees
export const taskAssignees = pgTable("task_assignees", {
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => userProfiles.id, { onDelete: "cascade" }).notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
});

// 7. Task Comments
export const taskComments = pgTable("task_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => userProfiles.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  contentEn: text("content_en"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. Task Issues / Blockers
export const taskIssues = pgTable("task_issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  issueDescription: text("issue_description").notNull(),
  issueDescriptionEn: text("issue_description_en"),
  raisedBy: uuid("raised_by").references(() => userProfiles.id).notNull(),
  raisedAt: timestamp("raised_at", { withTimezone: true }).defaultNow().notNull(),
  isResolved: boolean("is_resolved").default(false).notNull(),
  resolvedBy: uuid("resolved_by").references(() => userProfiles.id),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolutionDescription: text("resolution_description"),
  resolutionDescriptionEn: text("resolution_description_en"),
});

// 9. Task Attachments
export const taskAttachments = pgTable("task_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  originalSizeKb: integer("original_size_kb").notNull().default(0),
  compressedSizeKb: integer("compressed_size_kb").notNull().default(0),
  savedPercent: integer("saved_percent").notNull().default(0),
  uploadedBy: uuid("uploaded_by").references(() => userProfiles.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 10. QC Villa Inspections
export const qcInspections = pgTable("qc_inspections", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  inspectorId: uuid("inspector_id").references(() => userProfiles.id).notNull(),
  roundNumber: integer("round_number").notNull().default(1),
  inspectionDate: timestamp("inspection_date", { withTimezone: true }).defaultNow().notNull(),
  overallStatus: varchar("overall_status", { length: 50 }).notNull().default("in_progress"), // 'in_progress' | 'pending_approval' | 'passed' | 're_inspection_required'
  inspectorSignatureUrl: text("inspector_signature_url"),
  clientSignatureUrl: text("client_signature_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 11. QC Defects
export const qcDefects = pgTable("qc_defects", {
  id: uuid("id").primaryKey().defaultRandom(),
  inspectionId: uuid("inspection_id").references(() => qcInspections.id, { onDelete: "cascade" }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // 'exterior_ground' | 'structure_arch' | 'sanitary_plumbing' | 'electrical_safety' | 'pool_pump' | 'handover_keys'
  zone: varchar("zone", { length: 150 }).notNull(),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 50 }).notNull().default("minor"), // 'critical' | 'major' | 'minor'
  status: varchar("status", { length: 50 }).notNull().default("open"), // 'open' | 'fixing' | 'resolved'
  photoBeforeUrl: text("photo_before_url"),
  photoAfterUrl: text("photo_after_url"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Drizzle-Zod Generated Schemas
export const insertTaskSchema = createInsertSchema(tasks);
export const selectTaskSchema = createSelectSchema(tasks);
export const insertQcDefectSchema = createInsertSchema(qcDefects);
export const selectQcDefectSchema = createSelectSchema(qcDefects);
