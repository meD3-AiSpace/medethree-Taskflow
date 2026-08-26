// ====================================================================
// TaskFlow Manager — TypeScript Database & Domain Types (Phase 1 & Phase 2)
// ====================================================================

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer';

export type TaskCategory = 'design' | 'permit' | 'site' | 'other';

export type TaskStatus = 'todo' | 'assigned' | 'in_progress' | 'review' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type PermitStatus = 
  | 'preparing'       // เตรียมเอกสาร
  | 'submitted'       // ยื่นขอแล้ว
  | 'under_review'    // รอหน่วยงานพิจารณา
  | 'needs_revision'  // ติดปัญหา/รอแก้ไขตามคำสั่ง
  | 'approved'        // อนุมัติแล้ว
  | 'rejected';       // ถูกปฏิเสธ

export type NotificationType = 
  | 'new_assignment'
  | 'due_soon'
  | 'overdue'
  | 'new_comment'
  | 'status_changed'
  | 'issue_logged'
  | 'review_submitted'
  | 'revision_requested'
  | 'time_logged';

export interface NotificationPreferences {
  notify_assignment: boolean;
  notify_blocker: boolean;
  notify_review: boolean;
  notify_deadline: boolean;
  notify_line: boolean;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Team {
  id: string;
  org_id: string;
  name: string;
  name_en?: string | null;
  description?: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  org_id: string;
  line_user_id?: string | null;
  full_name: string;
  email: string;
  role: UserRole;
  team_id?: string | null;
  created_at: string;
  team?: Team | null;
  notification_preferences?: NotificationPreferences;
}

export interface Project {
  id: string;
  org_id: string;
  team_id?: string | null;
  name: string;
  name_en?: string | null;
  created_at: string;
  team?: Team | null;
}

export interface Task {
  id: string;
  org_id: string;
  project_id?: string | null;
  category: TaskCategory;
  title: string;
  title_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  created_by?: string | null;
  deadline?: string | null;
  status_changed_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  project?: Project | null;
  creator?: UserProfile | null;
  assignees?: UserProfile[];
  permit_details?: PermitDetails | null;
  issues?: TaskIssue[];
  comments?: Comment[];
  time_logs?: TimeEntry[];
  attachments?: TaskAttachment[];
  comments_count?: number;
  unresolved_issues_count?: number;
  total_time_minutes?: number;
}

export interface TaskAssignee {
  task_id: string;
  user_id: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  content_en?: string | null;
  created_at: string;
  user?: UserProfile | null;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_type: string; // 'image' | 'pdf' | 'spreadsheet' | 'cad' | 'other'
  file_url: string;
  thumbnail_url?: string | null;
  original_size_kb: number;
  compressed_size_kb: number;
  saved_percent: number;
  uploaded_by: string;
  created_at: string;
  uploader?: UserProfile | null;
}

export interface ActivityLog {
  id: string;
  task_id: string;
  user_id?: string | null;
  action: string;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
  user?: UserProfile | null;
}

export interface TaskIssue {
  id: string;
  task_id: string;
  issue_description: string;
  issue_description_en?: string | null;
  raised_by: string;
  raised_at: string;
  is_resolved: boolean;
  resolved_by?: string | null;
  resolved_at?: string | null;
  resolution_description?: string | null;
  resolution_description_en?: string | null;
  raised_user?: UserProfile | null;
  resolved_user?: UserProfile | null;
}

export interface PermitDetails {
  task_id: string;
  permit_type: string;
  permit_type_en?: string | null;
  authority: string;
  authority_en?: string | null;
  submitted_date?: string | null;
  target_approval_date?: string | null;
  revision_round: number;
  permit_status: PermitStatus;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  duration_minutes: number;
  hours?: number;
  minutes?: number;
  entry_type?: 'preset' | 'manual' | 'timer';
  note?: string | null;
  note_en?: string | null;
  logged_at: string;
  created_at: string;
  user?: UserProfile | null;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  task_id?: string | null;
  type: NotificationType;
  title: string;
  title_en?: string | null;
  message: string;
  message_en?: string | null;
  is_read: boolean;
  created_at: string;
  task?: Task | null;
}
