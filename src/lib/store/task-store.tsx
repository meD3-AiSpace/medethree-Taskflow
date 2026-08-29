"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskCategory,
  TaskIssue,
  PermitDetails,
  PermitStatus,
  ActivityLog,
  Comment,
  UserProfile,
  UserRole,
  Team,
  Project,
  NotificationItem,
  TaskAttachment,
  TimeEntry,
  NotificationPreferences,
} from "@/lib/types/database.types";
import { validateStateTransition } from "@/lib/workflow/state-machine";
import { translateText } from "@/lib/i18n/auto-translate";
import { SupabaseSyncService } from "@/lib/supabase/sync-service";
import { RealtimeSyncService } from "@/lib/supabase/realtime-service";

// Default Initial Organization
const defaultOrg = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "MeDTree Design & Build (Housing & Construction)",
  created_at: new Date().toISOString(),
};

// Comprehensive Professional Departments for Construction & Housing Estate Development (โครงการบ้านจัดสรร & รับเหมาก่อสร้าง)
const defaultTeams: Team[] = [
  {
    id: "team-consult",
    org_id: defaultOrg.id,
    name: "ฝ่ายที่ปรึกษาโครงการและกฎหมาย (Advisory & Legal/Permit)",
    name_en: "Advisory & Legal Permit Department",
    description: "ให้คำปรึกษากฎหมายอาคาร ผังเมือง กฎหมายจัดสรรที่ดิน และประสานงานราชการ",
    created_at: new Date().toISOString(),
  },
  {
    id: "team-design",
    org_id: defaultOrg.id,
    name: "ฝ่ายสำรวจและออกแบบ (Survey & Architectural Design)",
    name_en: "Survey & Architectural Design Department",
    description: "สำรวจพื้นที่ รังวัดที่ดิน ออกแบบสถาปัตยกรรม แปลน 3D Perspective และตกแต่งภายใน",
    created_at: new Date().toISOString(),
  },
  {
    id: "team-construction",
    org_id: defaultOrg.id,
    name: "ฝ่ายก่อสร้างและควบคุมงานสนาม (Construction & Site Engineering)",
    name_en: "Construction & Site Engineering Department",
    description: "ควบคุมงานก่อสร้างบ้านเดี่ยว ทาวน์โฮม อาคารชุด และงานสาธารณูปโภคหน้างานจริง",
    created_at: new Date().toISOString(),
  },
  {
    id: "team-mep",
    org_id: defaultOrg.id,
    name: "ฝ่ายงานระบบและสุขาภิบาล (MEP & Building Systems Engineering)",
    name_en: "MEP & Building Systems Engineering Department",
    description: "ควบคุมและติดตั้งงานระบบไฟฟ้า ประปา สุขาภิบาล แอร์ และระบบดับเพลิง",
    created_at: new Date().toISOString(),
  },
  {
    id: "team-qs",
    org_id: defaultOrg.id,
    name: "ฝ่ายประมาณราคาและควบคุมต้นทุน (Cost Control & Quantity Survey - QS)",
    name_en: "Cost Control & Quantity Survey (QS) Department",
    description: "ถอดแบบ คิดราคางาน BOQ ควบคุมงบประมาณโครงการ และตรวจงวดงานผู้รับเหมา",
    created_at: new Date().toISOString(),
  },
  {
    id: "team-procurement",
    org_id: defaultOrg.id,
    name: "ฝ่ายจัดซื้อและคลังวัสดุก่อสร้าง (Procurement & Material Inventory)",
    name_en: "Procurement & Material Inventory Department",
    description: "จัดซื้อเหล็ก ปูน คอนกรีต กระเบื้อง สุขภัณฑ์ คุมสต็อกและประสานงาน Supplier",
    created_at: new Date().toISOString(),
  },
  {
    id: "team-qaqc",
    org_id: defaultOrg.id,
    name: "ฝ่ายตรวจสอบคุณภาพและส่งมอบบ้าน (QA/QC & Home Handover)",
    name_en: "QA/QC & Home Handover Department",
    description: "ตรวจสอบมาตรฐานความปลอดภัย ตรวจ Defect บ้านก่อนส่งมอบลูกค้า และตรวจรับมอบบ้าน",
    created_at: new Date().toISOString(),
  },
  {
    id: "team-marketing",
    org_id: defaultOrg.id,
    name: "ฝ่ายการตลาดและการขาย (Marketing & Sales Development)",
    name_en: "Marketing, Sales & CRM Department",
    description: "วางแผนการตลาด ยิงโฆษณา จัดโปรโมชั่นบ้านตัวอย่าง ปิดการขาย และประสานงานสินเชื่อธนาคาร",
    created_at: new Date().toISOString(),
  },
  {
    id: "team-aftersale",
    org_id: defaultOrg.id,
    name: "ฝ่ายบริการหลังการขายและนิติบุคคล (After-Sales Service & Estate Management)",
    name_en: "After-Sales Service & Estate Management Department",
    description: "รับเรื่องเคลมประกันบ้าน 1-5 ปี ซ่อมบำรุง และบริหารจัดการสิ่งอำนวยความสะดวกในโครงการ",
    created_at: new Date().toISOString(),
  },
  {
    id: "team-bd",
    org_id: defaultOrg.id,
    name: "ฝ่ายพัฒนาธุรกิจและจัดหาที่ดิน (Business Development & Land Acquisition)",
    name_en: "Business Development & Land Acquisition Department",
    description: "จัดหาที่ดินแปลงใหม่ วิเคราะห์ความเป็นไปได้ทางการเงิน (Feasibility) และวางแผนพัฒนาโครงการ",
    created_at: new Date().toISOString(),
  },
  {
    id: "team-accounting",
    org_id: defaultOrg.id,
    name: "ฝ่ายบัญชีและการเงิน (Accounting & Finance)",
    name_en: "Accounting & Finance Department",
    description: "จัดการบัญชีต้นทุนโครงการ การเบิกจ่ายงวดงาน ภาษีที่ดิน และบริหารกระแสเงินสด",
    created_at: new Date().toISOString(),
  },
  {
    id: "team-admin",
    org_id: defaultOrg.id,
    name: "ฝ่ายสนับสนุนงานส่วนกลางและบุคคล (Central Support & Administration / HR)",
    name_en: "Central Support & Administration / HR Department",
    description: "งานสารบรรณ ธุรการ จัดการเอกสารสัญญา บริหารทรัพยากรบุคคล และยานพาหนะส่วนกลาง",
    created_at: new Date().toISOString(),
  },
];

// Authentic MeDTree Team Members created by Admin (Boss X)
const defaultUsers: UserProfile[] = [
  {
    id: "u-admin",
    org_id: defaultOrg.id,
    full_name: "X มีดีที่จำกัด (ที่ปรึกษาและAdmin)",
    email: "medethree@gmail.com",
    role: "admin",
    team_id: "team-consult",
    line_user_id: "Ud03173af920035ad7d808a0feb10327d",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-1787811151428",
    org_id: defaultOrg.id,
    full_name: "พี่อู๊ด Director",
    email: "user2020@medtree.com",
    role: "admin",
    team_id: "team-admin",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-designer",
    org_id: defaultOrg.id,
    full_name: "พี่หมู หัวหน้าสถาปนิก (Senior Architect / Design Lead)",
    email: "architect@medtree.com",
    role: "manager",
    team_id: "team-design",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-1787815353781",
    org_id: defaultOrg.id,
    full_name: "น้องเอิน สถาปนิกโครงการ",
    email: "user0190@medtree.com",
    role: "member",
    team_id: "team-design",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-1787815377977",
    org_id: defaultOrg.id,
    full_name: "พี่ต้น สถาปนิกโครงการ",
    email: "user8720@medtree.com",
    role: "member",
    team_id: "team-design",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-1787815445409",
    org_id: defaultOrg.id,
    full_name: "พี่วิช วิศวกรงานระบบPARAGON (MEP Engineer)",
    email: "user3744@medtree.com",
    role: "member",
    team_id: "team-mep",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-mep",
    org_id: defaultOrg.id,
    full_name: "พี่เอก วิศวกรงานระบบ BOPHUD(MEP Engineer)",
    email: "mep@medtree.com",
    role: "member",
    team_id: "team-mep",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-qs",
    org_id: defaultOrg.id,
    full_name: "P'Game ประมาณราคา (QS / Cost Controller)",
    email: "qs@medtree.com",
    role: "manager",
    team_id: "team-qs",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-1787815672824",
    org_id: defaultOrg.id,
    full_name: "พี่บัง วิศวกรงานระบบPARAGON (MEP Engineer)",
    email: "user8438@medtree.com",
    role: "member",
    team_id: "team-mep",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-1787815705161",
    org_id: defaultOrg.id,
    full_name: "พี่อ๊อด ผู้ควบคุมงาน",
    email: "user2434@medtree.com",
    role: "member",
    team_id: "team-construction",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-site",
    org_id: defaultOrg.id,
    full_name: "พี่โจ ช่างคุมงาน (Site Engineer / Supervisor)",
    email: "site.engineer@medtree.com",
    role: "manager",
    team_id: "team-construction",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-qa",
    org_id: defaultOrg.id,
    full_name: "พี่อ๊อด ตรวจรับมอบบ้าน (QA/QC Inspector)",
    email: "qa.qc@medtree.com",
    role: "member",
    team_id: "team-qaqc",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-marketing",
    org_id: defaultOrg.id,
    full_name: "P'PITA หัวหน้าการตลาด (Marketing & Sales Executive)",
    email: "sales@medtree.com",
    role: "manager",
    team_id: "team-marketing",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-1787815817013",
    org_id: defaultOrg.id,
    full_name: "P'TAWAN การตลาด (Marketing & Sales Executive)",
    email: "user5046@medtree.com",
    role: "member",
    team_id: "team-marketing",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-1787815855643",
    org_id: defaultOrg.id,
    full_name: "พี่ทับทิม บัญชี",
    email: "user8183@medtree.com",
    role: "member",
    team_id: "team-accounting",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-1787815885350",
    org_id: defaultOrg.id,
    full_name: "พี่หนุ่มพี่ออย จัดซื้อ",
    email: "user5888@medtree.com",
    role: "member",
    team_id: "team-procurement",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-1787815917247",
    org_id: defaultOrg.id,
    full_name: "หัวหน้าสโตร์",
    email: "user7564@medtree.com",
    role: "member",
    team_id: "team-procurement",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-1787815994579",
    org_id: defaultOrg.id,
    full_name: "พี่ป้อ ดูแลหลังการขาย",
    email: "user6854@medtree.com",
    role: "member",
    team_id: "team-aftersale",
    created_at: new Date().toISOString(),
  },
];

const defaultProjects: Project[] = [
  {
    id: "p-1",
    org_id: defaultOrg.id,
    team_id: "team-design",
    name: "โครงการบ้านเดี่ยว The Forest Villa",
    name_en: "The Forest Villa Residence Project",
    created_at: new Date().toISOString(),
  },
  {
    id: "p-2",
    org_id: defaultOrg.id,
    team_id: "team-consult",
    name: "โครงการคอนโดมิเนียมสุขุมวิท 49",
    name_en: "Sukhumvit 49 Condominium Project",
    created_at: new Date().toISOString(),
  },
  {
    id: "p-3",
    org_id: defaultOrg.id,
    team_id: "team-construction",
    name: "โครงการทาวน์โฮม Grand Living สาทร-ราชพฤกษ์",
    name_en: "Grand Living Townhome Project",
    created_at: new Date().toISOString(),
  },
];

// Initial Live Production State Arrays (Zero Mock Data)
const initialTasks: Task[] = [];
const initialIssues: TaskIssue[] = [];
const initialActivityLogs: ActivityLog[] = [];
const initialComments: Comment[] = [];
const initialNotifications: NotificationItem[] = [];
const initialAttachments: TaskAttachment[] = [];
const initialTimeEntries: TimeEntry[] = [];

interface TaskContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  isAuthInitialized: boolean;
  login: (user: UserProfile) => void;
  logout: () => void;
  logUserActivity: (action: string, details?: string) => void;
  tasks: Task[];
  issues: TaskIssue[];
  activityLogs: ActivityLog[];
  comments: Comment[];
  attachments: TaskAttachment[];
  timeEntries: TimeEntry[];
  notifications: NotificationItem[];
  teams: Team[];
  users: UserProfile[];
  projects: Project[];
  // User Management Actions
  addUser: (userData: { full_name: string; email: string; role: UserRole; team_id?: string; line_user_id?: string; phone_number?: string }) => UserProfile;
  updateUser: (userId: string, updates: Partial<UserProfile>) => void;
  deleteUser: (userId: string) => { success: boolean; message?: string };
  // Team Management Actions
  addTeam: (name: string, nameEn?: string, description?: string) => Team;
  updateTeam: (teamId: string, name: string, nameEn?: string, description?: string) => void;
  deleteTeam: (teamId: string) => { success: boolean; message?: string };
  resetDefaultTeams: () => void;
  // Project Actions
  addProject: (name: string, nameEn?: string, teamId?: string) => Project;
  updateProject: (projectId: string, name: string, nameEn?: string, teamId?: string) => void;
  deleteProject: (projectId: string) => { success: boolean; message?: string };
  // Task Actions
  createTask: (task: Partial<Task>, permitData?: Partial<PermitDetails>) => Promise<Task>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => { success: boolean; message?: string };
  updateTaskDetails: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => { success: boolean; message?: string };
  // Issue Actions (Section 3.7)
  addIssue: (taskId: string, description: string, descriptionEn?: string) => Promise<TaskIssue>;
  resolveIssue: (issueId: string, resolution: string, resolutionEn?: string) => Promise<void>;
  // Permit Actions (Section 3.8)
  updatePermitDetails: (taskId: string, updates: Partial<PermitDetails>) => void;
  updatePermitStatus: (taskId: string, newStatus: PermitStatus) => void;
  // Comments
  addComment: (taskId: string, content: string, contentEn?: string) => Promise<Comment>;
  updateComment: (commentId: string, content: string, contentEn?: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  // Phase 2: Time Tracking Actions
  addTimeLog: (taskId: string, entry: Omit<TimeEntry, 'id' | 'created_at'>) => TimeEntry;
  deleteTimeLog: (taskId: string, logId: string) => void;
  // Phase 2: Deliverable & File Attachment Actions
  addAttachment: (taskId: string, attachment: Omit<TaskAttachment, 'id' | 'created_at'>) => TaskAttachment;
  deleteAttachment: (taskId: string, attachmentId: string) => void;
  // Phase 2: Notification Preferences Actions
  updateNotificationPreferences: (userId: string, prefs: NotificationPreferences) => void;
  // Notifications & LINE
  markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void;
  updateLineUserId: (userId: string, lineUserId: string) => void;
  sendMockLinePush: (taskId: string, title: string, message: string) => Promise<{ success: boolean; error?: string }>;
  // Cloud Sync & Disaster Recovery
  isSyncing: boolean;
  syncCloudData: () => Promise<boolean>;
  restoreBackupData: (backupJson: any) => Promise<boolean>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(defaultUsers[0]);
  const [isAuthInitialized, setIsAuthInitialized] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [issues, setIssues] = useState<TaskIssue[]>(initialIssues);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [attachments, setAttachments] = useState<TaskAttachment[]>(initialAttachments);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(initialTimeEntries);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [users, setUsers] = useState<UserProfile[]>(defaultUsers);
  const [teams, setTeams] = useState<Team[]>(defaultTeams);
  const [projects, setProjects] = useState<Project[]>(defaultProjects);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    try {
      // 1. Restore saved users list first
      let activeUsersList: UserProfile[] = defaultUsers;
      const savedUsersStr = localStorage.getItem("taskflow_users");
      if (savedUsersStr) {
        try {
          const parsedUsers = JSON.parse(savedUsersStr);
          if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
            activeUsersList = parsedUsers;
            setUsers(parsedUsers);
          }
        } catch {}
      } else {
        try {
          localStorage.setItem("taskflow_users", JSON.stringify(defaultUsers));
        } catch {}
      }

      // 2. Restore saved user session
      const savedUserStr = localStorage.getItem("taskflow_current_user");
      let activeUser: UserProfile | null = null;
      if (savedUserStr) {
        if (savedUserStr.startsWith("{")) {
          const parsed = JSON.parse(savedUserStr);
          if (parsed && parsed.id) {
            const matchedInUsers = activeUsersList.find((u) => u.id === parsed.id) || parsed;
            activeUser = matchedInUsers;
            setCurrentUser(matchedInUsers);
          }
        } else {
          const found = activeUsersList.find((u) => u.id === savedUserStr) || defaultUsers.find((u) => u.id === savedUserStr);
          if (found) {
            activeUser = found;
            setCurrentUser(found);
          }
        }
      } else if (activeUsersList.length > 0) {
        setCurrentUser(activeUsersList[0]);
      }

      // 3. Restore saved teams
      const savedTeamsStr = localStorage.getItem("taskflow_teams");
      if (savedTeamsStr) {
        const parsedTeams = JSON.parse(savedTeamsStr);
        if (Array.isArray(parsedTeams) && parsedTeams.length > 0) {
          setTeams(parsedTeams);
        }
      }

      // 4. Restore saved projects
      const savedProjectsStr = localStorage.getItem("taskflow_projects");
      if (savedProjectsStr) {
        const parsedProjects = JSON.parse(savedProjectsStr);
        if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
          setProjects(parsedProjects);
        }
      }

      // 5. Restore saved issues
      const savedIssuesStr = localStorage.getItem("taskflow_issues");
      if (savedIssuesStr) {
        const parsedIssues = JSON.parse(savedIssuesStr);
        if (Array.isArray(parsedIssues) && parsedIssues.length > 0) {
          setIssues(parsedIssues);
        }
      }

      // 6. Restore saved tasks
      const savedTasksStr = localStorage.getItem("taskflow_tasks");
      if (savedTasksStr) {
        const parsedTasks = JSON.parse(savedTasksStr);
        if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
          setTasks(parsedTasks);
        }
      }

      // 7. Restore saved activity logs (for audit statistics & telemetry)
      const savedLogsStr = localStorage.getItem("taskflow_logs");
      if (savedLogsStr) {
        const parsedLogs = JSON.parse(savedLogsStr);
        if (Array.isArray(parsedLogs) && parsedLogs.length > 0) {
          setActivityLogs(parsedLogs);
        }
      }

      // 8. Restore saved comments
      const savedCommentsStr = localStorage.getItem("taskflow_comments");
      if (savedCommentsStr) {
        const parsedComments = JSON.parse(savedCommentsStr);
        if (Array.isArray(parsedComments) && parsedComments.length > 0) {
          setComments(parsedComments);
        }
      }

      // 9. Restore saved attachments
      const savedAttsStr = localStorage.getItem("taskflow_attachments");
      if (savedAttsStr) {
        const parsedAtts = JSON.parse(savedAttsStr);
        if (Array.isArray(parsedAtts) && parsedAtts.length > 0) {
          setAttachments(parsedAtts);
        }
      }

      // 10. Restore saved time entries
      const savedTimeStr = localStorage.getItem("taskflow_time_entries");
      if (savedTimeStr) {
        const parsedTime = JSON.parse(savedTimeStr);
        if (Array.isArray(parsedTime) && parsedTime.length > 0) {
          setTimeEntries(parsedTime);
        }
      }

      // 11. Restore saved notifications
      const savedNotifsStr = localStorage.getItem("taskflow_notifications");
      if (savedNotifsStr) {
        const parsedNotifs = JSON.parse(savedNotifsStr);
        if (Array.isArray(parsedNotifs) && parsedNotifs.length > 0) {
          setNotifications(parsedNotifs);
        }
      }
    } catch (err) {
      console.warn("[TaskProvider Mount Restore Error]:", err);
    }
    setIsAuthInitialized(true);
  }, []);

  const logUserActivity = (action: string, details?: string, targetUser?: UserProfile) => {
    const userToLog = targetUser || currentUser;
    if (!userToLog) return;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      task_id: "global",
      user_id: userToLog.id,
      action: action,
      new_value: details || action,
      created_at: new Date().toISOString(),
      user: userToLog,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    try {
      const existingLogs: ActivityLog[] = JSON.parse(localStorage.getItem("taskflow_logs") || "[]");
      const updatedLogs = [newLog, ...existingLogs.filter(l => l.id !== newLog.id)].slice(0, 150);
      localStorage.setItem("taskflow_logs", JSON.stringify(updatedLogs));
    } catch {}
    // Also push to cloud
    SupabaseSyncService.saveActivityLog(newLog);
  };

  const login = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("taskflow_current_user", JSON.stringify(user));
    } catch {}
    logUserActivity("user_login", `เข้าสู่ระบบ (${user.role.toUpperCase()})`, user);
  };

  const logout = () => {
    if (currentUser) {
      logUserActivity("user_logout", "ออกจากระบบ");
    }
    try {
      localStorage.removeItem("taskflow_current_user");
    } catch {}
    setCurrentUser(null as any);
  };

  const applyCloudData = (cloudData: any) => {
    if (!cloudData) return;

    if (cloudData.tasks && Array.isArray(cloudData.tasks)) {
      let localTasks: Task[] = [];
      try {
        const saved = localStorage.getItem("taskflow_tasks");
        if (saved) localTasks = JSON.parse(saved);
      } catch {}

      const mappedTasks: Task[] = cloudData.tasks.map((dbTask: any) => {
        const project = cloudData.projects?.find((p: any) => p.id === dbTask.project_id) || defaultProjects[0];
        const creator = cloudData.users?.find((u: any) => u.id === dbTask.created_by) || defaultUsers[0];
        const permit = cloudData.permits?.find((p: any) => p.task_id === dbTask.id);
        const taskComments = (cloudData.comments || []).filter((c: any) => c.task_id === dbTask.id);
        const taskIssues = (cloudData.issues || []).filter((i: any) => i.task_id === dbTask.id && !i.is_resolved);

        const cloudTaskAssignees = (cloudData.assignees || [])
          .filter((a: any) => a.task_id === dbTask.id)
          .map((a: any) => (cloudData.users || users).find((u: any) => u.id === a.user_id))
          .filter(Boolean);

        const localTask = localTasks.find((t) => t.id === dbTask.id) || tasks.find((t) => t.id === dbTask.id);
        const taskAssignees = cloudTaskAssignees.length > 0
          ? cloudTaskAssignees
          : (localTask?.assignees && localTask.assignees.length > 0)
            ? localTask.assignees
            : (creator ? [creator] : []);

        const taskAtts = (cloudData.attachments || []).filter((a: any) => a.task_id === dbTask.id);

        return {
          ...dbTask,
          project,
          creator,
          assignees: taskAssignees,
          attachments: taskAtts.length > 0 ? taskAtts : (localTask?.attachments || []),
          permit_details: permit || localTask?.permit_details || undefined,
          comments_count: taskComments.length,
          unresolved_issues_count: taskIssues.length,
        };
      });

      setTasks(mappedTasks);
      try { localStorage.setItem("taskflow_tasks", JSON.stringify(mappedTasks)); } catch {}
    }

    if (cloudData.teams && Array.isArray(cloudData.teams) && cloudData.teams.length > 0) {
      const mergedTeams: Team[] = cloudData.teams.map((ct: any) => ({
        id: ct.id,
        org_id: ct.org_id || defaultOrg.id,
        name: ct.name || "ฝ่ายงาน",
        name_en: ct.name_en || ct.name || "Department",
        description: ct.description || "",
        created_at: ct.created_at || new Date().toISOString(),
      }));
      setTeams(mergedTeams);
      saveTeamsState(mergedTeams);
    }

    if (cloudData.projects && Array.isArray(cloudData.projects)) {
      if (cloudData.projects.length > 0) {
        const mergedProjects: Project[] = cloudData.projects.map((cp: any) => ({
          id: cp.id,
          org_id: cp.org_id || defaultOrg.id,
          name: cp.name || "โครงการ",
          name_en: cp.name_en || cp.name || "Project",
          team_id: cp.team_id || "team-design",
          created_at: cp.created_at || new Date().toISOString(),
        }));
        setProjects(mergedProjects);
        try { localStorage.setItem("taskflow_projects", JSON.stringify(mergedProjects)); } catch {}
      }
    }

    if (cloudData.users && Array.isArray(cloudData.users) && cloudData.users.length > 0) {
      let currentUsersList = users;
      try {
        const saved = localStorage.getItem("taskflow_users");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) currentUsersList = parsed;
        }
      } catch {}

      const userMap = new Map<string, UserProfile>();
      currentUsersList.forEach((u) => userMap.set(u.id, u));

      cloudData.users.forEach((cu: any) => {
        const existing = userMap.get(cu.id);
        if (existing) {
          userMap.set(cu.id, {
            ...existing,
            full_name: existing.full_name || cu.full_name,
            email: existing.email || cu.email,
            role: existing.role || cu.role,
            team_id: existing.team_id || cu.team_id,
            line_user_id: existing.line_user_id || cu.line_user_id,
            phone_number: existing.phone_number || cu.phone_number,
          });
        } else {
          userMap.set(cu.id, {
            id: cu.id,
            org_id: cu.org_id || defaultOrg.id,
            full_name: cu.full_name || "ผู้ใช้งาน",
            email: cu.email || "user@medtree.com",
            role: (cu.role || "member") as UserRole,
            team_id: cu.team_id || "team-consult",
            phone_number: cu.phone_number || undefined,
            line_user_id: cu.line_user_id || undefined,
            created_at: cu.created_at || new Date().toISOString(),
          });
        }
      });

      const mergedUsers = Array.from(userMap.values());
      setUsers(mergedUsers);
      saveUsersState(mergedUsers);

      const currentMatch = mergedUsers.find((u) => u.id === currentUser.id);
      if (currentMatch) {
        setCurrentUser(currentMatch);
        try { localStorage.setItem("taskflow_current_user", JSON.stringify(currentMatch)); } catch {}
      }
    }

    if (cloudData.comments && Array.isArray(cloudData.comments)) {
      setComments(cloudData.comments);
      try { localStorage.setItem("taskflow_comments", JSON.stringify(cloudData.comments)); } catch {}
    }
    if (cloudData.attachments && Array.isArray(cloudData.attachments)) {
      setAttachments(cloudData.attachments);
      try { localStorage.setItem("taskflow_attachments", JSON.stringify(cloudData.attachments)); } catch {}
    }
    if (cloudData.issues && Array.isArray(cloudData.issues)) {
      setIssues(cloudData.issues);
      try { localStorage.setItem("taskflow_issues", JSON.stringify(cloudData.issues)); } catch {}
    }
    if (cloudData.timeEntries && Array.isArray(cloudData.timeEntries)) {
      setTimeEntries(cloudData.timeEntries);
      try { localStorage.setItem("taskflow_time_entries", JSON.stringify(cloudData.timeEntries)); } catch {}
    }
    if (cloudData.activityLogs && Array.isArray(cloudData.activityLogs)) {
      let localLogs: ActivityLog[] = [];
      try {
        const saved = localStorage.getItem("taskflow_logs");
        if (saved) localLogs = JSON.parse(saved);
      } catch {}
      const logMap = new Map<string, ActivityLog>();
      localLogs.forEach((l) => logMap.set(l.id, l));
      cloudData.activityLogs.forEach((cl: any) => logMap.set(cl.id, cl));
      const mergedLogs = Array.from(logMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setActivityLogs(mergedLogs);
      try { localStorage.setItem("taskflow_logs", JSON.stringify(mergedLogs.slice(0, 150))); } catch {}
    }
  };

  const syncCloudData = async (): Promise<boolean> => {
    try {
      setIsSyncing(true);
      const cloudData = await SupabaseSyncService.fetchCloudData(currentUser?.org_id || defaultOrg.id);
      if (cloudData) {
        applyCloudData(cloudData);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("[Cloud Data Manual Sync Error]:", err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const restoreBackupData = async (backupJson: any): Promise<boolean> => {
    try {
      if (!backupJson || typeof backupJson !== "object") return false;
      const data = backupJson.data || backupJson;
      applyCloudData(data);
      return true;
    } catch (err) {
      console.error("[Restore Backup Error]:", err);
      return false;
    }
  };

  // Multi-Device Real-Time & Resilient Auto-Sync
  useEffect(() => {
    let isMounted = true;
    const targetOrgId = currentUser?.org_id || defaultOrg.id;

    const fetchLatest = async (silent = false) => {
      try {
        if (!silent) setIsSyncing(true);
        const cloudData = await SupabaseSyncService.fetchCloudData(targetOrgId);
        if (isMounted && cloudData) {
          applyCloudData(cloudData);
        }
      } catch (err) {
        console.warn("[Cloud Data Auto-Sync Error]:", err);
      } finally {
        if (isMounted && !silent) setIsSyncing(false);
      }
    };

    // 1. Initial Load on Mount
    fetchLatest(false);

    // 2. Connect Supabase Real-Time WebSocket Channel (<200ms Instant Delta Merge)
    RealtimeSyncService.subscribeToOrg(targetOrgId);

    const unsubRealtime = RealtimeSyncService.onRealtimeEvent((event) => {
      if (!isMounted) return;

      if (event.table === "tasks") {
        if (event.eventType === "INSERT") {
          const raw = event.newRecord;
          const project = projects.find((p) => p.id === raw.project_id) || defaultProjects[0];
          const creator = users.find((u) => u.id === raw.created_by) || currentUser;
          const newTask: Task = {
            id: raw.id,
            org_id: raw.org_id || targetOrgId,
            project_id: raw.project_id || project.id,
            category: raw.category || "design",
            title: raw.title || "งานใหม่",
            title_en: raw.title_en || raw.title,
            description: raw.description || "",
            description_en: raw.description_en || raw.description,
            status: raw.status || "todo",
            priority: raw.priority || "medium",
            created_by: raw.created_by || creator.id,
            deadline: raw.deadline || null,
            created_at: raw.created_at || new Date().toISOString(),
            updated_at: raw.updated_at || new Date().toISOString(),
            project,
            creator,
            assignees: [],
            comments_count: 0,
            unresolved_issues_count: 0,
          };
          setTasks((prev) => {
            if (prev.some((t) => t.id === raw.id)) return prev;
            const updated = [newTask, ...prev];
            try { localStorage.setItem("taskflow_tasks", JSON.stringify(updated)); } catch {}
            return updated;
          });
        } else if (event.eventType === "UPDATE") {
          const raw = event.newRecord;
          setTasks((prev) => {
            const updated = prev.map((t) => (t.id === raw.id ? { ...t, ...raw } : t));
            try { localStorage.setItem("taskflow_tasks", JSON.stringify(updated)); } catch {}
            return updated;
          });
        } else if (event.eventType === "DELETE") {
          const raw = event.oldRecord;
          if (raw?.id) {
            setTasks((prev) => {
              const updated = prev.filter((t) => t.id !== raw.id);
              try { localStorage.setItem("taskflow_tasks", JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
        }
      } else if (event.table === "task_issues") {
        if (event.eventType === "INSERT") {
          const raw = event.newRecord;
          setIssues((prev) => {
            if (prev.some((i) => i.id === raw.id)) return prev;
            const updated = [raw, ...prev];
            try { localStorage.setItem("taskflow_issues", JSON.stringify(updated)); } catch {}
            return updated;
          });
        } else if (event.eventType === "UPDATE") {
          const raw = event.newRecord;
          setIssues((prev) => {
            const updated = prev.map((i) => (i.id === raw.id ? { ...i, ...raw } : i));
            try { localStorage.setItem("taskflow_issues", JSON.stringify(updated)); } catch {}
            return updated;
          });
        } else if (event.eventType === "DELETE") {
          const raw = event.oldRecord;
          if (raw?.id) {
            setIssues((prev) => {
              const updated = prev.filter((i) => i.id !== raw.id);
              try { localStorage.setItem("taskflow_issues", JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
        }
      } else if (event.table === "comments") {
        if (event.eventType === "INSERT") {
          const raw = event.newRecord;
          setComments((prev) => {
            if (prev.some((c) => c.id === raw.id)) return prev;
            const updated = [...prev, raw];
            try { localStorage.setItem("taskflow_comments", JSON.stringify(updated)); } catch {}
            return updated;
          });
        }
      } else if (event.table === "users") {
        if (event.eventType === "INSERT" || event.eventType === "UPDATE") {
          const raw = event.newRecord;
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === raw.id);
            const updated = exists ? prev.map((u) => (u.id === raw.id ? { ...u, ...raw } : u)) : [...prev, raw];
            try { localStorage.setItem("taskflow_users", JSON.stringify(updated)); } catch {}
            return updated;
          });
          if (currentUser?.id === raw.id) {
            setCurrentUser((prev) => ({ ...prev, ...raw }));
          }
        }
      }
    });

    // 3. Window Focus Sync (When switching back to this browser tab or unlocking device)
    const handleFocus = () => {
      fetchLatest(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchLatest(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    // 4. Gentle Background Heartbeat (every 30 seconds as safety net)
    const interval = setInterval(() => {
      fetchLatest(true);
    }, 30000);

    return () => {
      isMounted = false;
      unsubRealtime();
      RealtimeSyncService.unsubscribe();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, []);

  const saveState = (newTasks: Task[], newIssues: TaskIssue[], newLogs: ActivityLog[]) => {
    try {
      localStorage.setItem("taskflow_tasks", JSON.stringify(newTasks));
      localStorage.setItem("taskflow_issues", JSON.stringify(newIssues));
      localStorage.setItem("taskflow_logs", JSON.stringify(newLogs));
    } catch {
      // storage quota
    }
  };

  const saveUsersState = (newUsers: UserProfile[]) => {
    try {
      localStorage.setItem("taskflow_users", JSON.stringify(newUsers));
    } catch {}
  };

  const saveTeamsState = (newTeams: Team[]) => {
    try {
      localStorage.setItem("taskflow_teams", JSON.stringify(newTeams));
    } catch {}
  };

  const resetDefaultTeams = () => {
    setTeams(defaultTeams);
    saveTeamsState(defaultTeams);
  };

  // User Management with Full Cloud Persistence
  const addUser = (userData: {
    full_name: string;
    email: string;
    role: UserRole;
    team_id?: string;
    line_user_id?: string;
    phone_number?: string;
  }): UserProfile => {
    const newUser: UserProfile = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      org_id: defaultOrg.id,
      full_name: userData.full_name,
      email: userData.email,
      role: userData.role,
      team_id: userData.team_id || teams[0]?.id || "team-design",
      phone_number: userData.phone_number || null,
      line_user_id: userData.line_user_id || null,
      created_at: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveUsersState(updatedUsers);
    SupabaseSyncService.saveUser(newUser);
    logUserActivity("user_created", `เพิ่มสมาชิกใหม่: ${newUser.full_name} (${newUser.email}) - สิทธิ์ ${newUser.role.toUpperCase()}`);
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<UserProfile>) => {
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
    setUsers(updatedUsers);
    saveUsersState(updatedUsers);

    const targetUser = updatedUsers.find((u) => u.id === userId);
    if (targetUser) {
      SupabaseSyncService.saveUser(targetUser);
    } else {
      SupabaseSyncService.saveUser({ id: userId, ...updates });
    }

    if (currentUser.id === userId) {
      const updatedCurrent = { ...currentUser, ...updates };
      setCurrentUser(updatedCurrent);
      try {
        localStorage.setItem("taskflow_current_user", JSON.stringify(updatedCurrent));
      } catch {}
    }

    logUserActivity("user_updated", `แก้ไขข้อมูลสมาชิก: ${targetUser?.full_name || userId} (${targetUser?.email || ""})`);

    if (updates.full_name || updates.role) {
      const updatedTasks = tasks.map((t) => ({
        ...t,
        assignees: t.assignees?.map((a) => (a.id === userId ? { ...a, ...updates } : a)),
        creator: t.creator?.id === userId ? { ...t.creator, ...updates } : t.creator,
      }));
      setTasks(updatedTasks);
      saveState(updatedTasks, issues, activityLogs);
    }
  };

  const deleteUser = (userId: string): { success: boolean; message?: string } => {
    if (users.length <= 1) {
      return { success: false, message: "ไม่สามารถลบผู้ใช้คนสุดท้ายของระบบได้" };
    }
    const targetUser = users.find(u => u.id === userId);
    const updatedUsers = users.filter((u) => u.id !== userId);
    setUsers(updatedUsers);
    saveUsersState(updatedUsers);
    SupabaseSyncService.deleteUser(userId);
    logUserActivity("user_deleted", `ลบสมาชิก: ${targetUser?.full_name || userId}`);

    if (currentUser.id === userId && updatedUsers.length > 0) {
      setCurrentUser(updatedUsers[0]);
      try {
        localStorage.setItem("taskflow_current_user", JSON.stringify(updatedUsers[0]));
      } catch {}
    }
    return { success: true };
  };

  // Team Management with Full Cloud Persistence
  const addTeam = (name: string, nameEn?: string, description?: string): Team => {
    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      org_id: defaultOrg.id,
      name,
      name_en: nameEn || name,
      description: description || "",
      created_at: new Date().toISOString(),
    };
    const updatedTeams = [...teams, newTeam];
    setTeams(updatedTeams);
    saveTeamsState(updatedTeams);
    SupabaseSyncService.saveTeam(newTeam);
    logUserActivity("team_created", `เพิ่มฝ่ายงาน: ${name}`);
    return newTeam;
  };

  const updateTeam = (teamId: string, name: string, nameEn?: string, description?: string) => {
    const updatedTeams = teams.map((t) => (t.id === teamId ? { ...t, name, name_en: nameEn || t.name_en, description: description || t.description } : t));
    setTeams(updatedTeams);
    saveTeamsState(updatedTeams);
    SupabaseSyncService.saveTeam({ id: teamId, name, name_en: nameEn, description });
    logUserActivity("team_updated", `แก้ไขฝ่ายงาน: ${name}`);
  };

  const deleteTeam = (teamId: string): { success: boolean; message?: string } => {
    if (teams.length <= 1) {
      return { success: false, message: "ไม่สามารถลบทีมสุดท้ายได้" };
    }
    const targetTeam = teams.find(t => t.id === teamId);
    const updatedTeams = teams.filter((t) => t.id !== teamId);
    setTeams(updatedTeams);
    saveTeamsState(updatedTeams);
    SupabaseSyncService.deleteTeam(teamId);
    logUserActivity("team_deleted", `ลบฝ่ายงาน: ${targetTeam?.name || teamId}`);
    return { success: true };
  };

  // Project Management with Full Cloud Persistence
  const addProject = (name: string, nameEn?: string, teamId?: string): Project => {
    const newProject: Project = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      org_id: defaultOrg.id,
      name,
      name_en: nameEn || name,
      team_id: teamId || teams[0]?.id || "team-design",
      created_at: new Date().toISOString(),
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    try { localStorage.setItem("taskflow_projects", JSON.stringify(updated)); } catch {}
    SupabaseSyncService.saveProject(newProject);
    logUserActivity("project_created", `เพิ่มโครงการใหม่: ${name}`);
    return newProject;
  };

  const updateProject = (projectId: string, name: string, nameEn?: string, teamId?: string) => {
    const updated = projects.map((p) => (p.id === projectId ? { ...p, name, name_en: nameEn || p.name_en, team_id: teamId || p.team_id } : p));
    setProjects(updated);
    try { localStorage.setItem("taskflow_projects", JSON.stringify(updated)); } catch {}
    SupabaseSyncService.saveProject({ id: projectId, name, name_en: nameEn, team_id: teamId });
    logUserActivity("project_updated", `แก้ไขโครงการ: ${name}`);
  };

  const deleteProject = (projectId: string): { success: boolean; message?: string } => {
    if (projects.length <= 1) {
      return { success: false, message: "ไม่สามารถลบโครงการสุดท้ายได้ (ต้องมีอย่างน้อย 1 โครงการ)" };
    }
    const targetProject = projects.find(p => p.id === projectId);
    const updatedProjects = projects.filter((p) => p.id !== projectId);
    setProjects(updatedProjects);

    const fallbackProject = updatedProjects[0];
    const updatedTasks = tasks.map((t) =>
      t.project_id === projectId
        ? { ...t, project_id: fallbackProject ? fallbackProject.id : null, project: fallbackProject }
        : t
    );
    setTasks(updatedTasks);

    try {
      localStorage.setItem("taskflow_projects", JSON.stringify(updatedProjects));
      localStorage.setItem("taskflow_tasks", JSON.stringify(updatedTasks));
    } catch {}

    SupabaseSyncService.deleteProject(projectId);
    logUserActivity("project_deleted", `ลบโครงการ: ${targetProject?.name || projectId}`);
    return { success: true };
  };

  const createTask = async (taskData: Partial<Task>, permitData?: Partial<PermitDetails>): Promise<Task> => {
    const taskId = `task-${Date.now()}`;
    const project = projects.find((p) => p.id === taskData.project_id) || projects[0];

    let titleEn = taskData.title_en;
    let descEn = taskData.description_en;

    if (!titleEn && taskData.title) {
      const trans = await translateText(taskData.title);
      titleEn = trans.translatedText;
    }
    if (!descEn && taskData.description) {
      const trans = await translateText(taskData.description);
      descEn = trans.translatedText;
    }

    const newTask: Task = {
      id: taskId,
      org_id: defaultOrg.id,
      project_id: project.id,
      category: taskData.category || "design",
      title: taskData.title || "งานใหม่",
      title_en: titleEn || taskData.title || "New Task",
      description: taskData.description || "",
      description_en: descEn || taskData.description || "",
      status: taskData.status || "todo",
      priority: taskData.priority || "medium",
      created_by: currentUser.id,
      deadline: taskData.deadline || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project,
      creator: currentUser,
      assignees: taskData.assignees || [],
      comments_count: 0,
      unresolved_issues_count: 0,
    };

    if (newTask.category === "permit") {
      let permitTypeEn = permitData?.permit_type_en;
      let authorityEn = permitData?.authority_en;

      if (!permitTypeEn && permitData?.permit_type) {
        const trans = await translateText(permitData.permit_type);
        permitTypeEn = trans.translatedText;
      }
      if (!authorityEn && permitData?.authority) {
        const trans = await translateText(permitData.authority);
        authorityEn = trans.translatedText;
      }

      newTask.permit_details = {
        task_id: taskId,
        permit_type: permitData?.permit_type || "ใบอนุญาตก่อสร้าง (อ.1)",
        permit_type_en: permitTypeEn || "Building Construction Permit (Form A.1)",
        authority: permitData?.authority || "สำนักงานเขต/เทศบาล",
        authority_en: authorityEn || "District Office / Municipality",
        submitted_date: permitData?.submitted_date || null,
        target_approval_date: permitData?.target_approval_date || null,
        revision_round: 0,
        permit_status: permitData?.permit_status || "preparing",
      };
    }

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      task_id: taskId,
      user_id: currentUser.id,
      action: "task_created",
      new_value: newTask.status,
      created_at: new Date().toISOString(),
      user: currentUser,
    };

    const updatedTasks = [newTask, ...tasks];
    const updatedLogs = [newLog, ...activityLogs];
    setTasks(updatedTasks);
    setActivityLogs(updatedLogs);
    saveState(updatedTasks, issues, updatedLogs);

    // Persist to Supabase Cloud for cross-device visibility
    SupabaseSyncService.saveTask(newTask, newTask.permit_details || undefined);
    SupabaseSyncService.saveActivityLog(newLog);

    if (newTask.assignees && newTask.assignees.length > 0) {
      newTask.assignees.forEach((assignee) => {
        const notif: NotificationItem = {
          id: `notif-${Date.now()}-${assignee.id}`,
          user_id: assignee.id,
          task_id: taskId,
          type: "new_assignment",
          title: "ได้รับมอบหมายงานใหม่",
          message: `คุณได้รับมอบหมายงาน: "${newTask.title}"`,
          is_read: false,
          created_at: new Date().toISOString(),
        };
        setNotifications((prev) => [notif, ...prev]);
      });
    }

    return newTask;
  };

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus): { success: boolean; message?: string } => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: "ไม่พบงานที่ระบุ" };

    const taskCommentsCount = comments.filter((c) => c.task_id === taskId).length;

    const validation = validateStateTransition({
      currentStatus: task.status,
      targetStatus: newStatus,
      deadlineSet: !!task.deadline,
      assigneeIds: (task.assignees || []).map((a) => a.id),
      actorId: currentUser.id,
      actorRole: currentUser.role,
      evidenceCount: taskCommentsCount,
    });

    if (!validation.allowed) {
      return { success: false, message: validation.reason };
    }

    const oldStatus = task.status;
    const updatedTask: Task = {
      ...task,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      task_id: taskId,
      user_id: currentUser.id,
      action: "status_changed",
      old_value: oldStatus,
      new_value: newStatus,
      created_at: new Date().toISOString(),
      user: currentUser,
    };

    const updatedTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t));
    const updatedLogs = [newLog, ...activityLogs];
    setTasks(updatedTasks);
    setActivityLogs(updatedLogs);
    saveState(updatedTasks, issues, updatedLogs);

    // Persist status change & activity log to Supabase Cloud
    SupabaseSyncService.saveTask({
      id: taskId,
      status: newStatus,
      status_changed_at: new Date().toISOString(),
    });
    SupabaseSyncService.saveActivityLog(newLog);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: task.created_by || currentUser.id,
      task_id: taskId,
      type: "status_changed",
      title: "สถานะงานเปลี่ยนแปลง",
      message: `งาน "${task.title}" เปลี่ยนสถานะเป็น ${newStatus}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);

    return { success: true };
  };

  const updateTaskDetails = (taskId: string, updates: Partial<Task>) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newLogs: ActivityLog[] = [];
    if (updates.deadline && updates.deadline !== task.deadline) {
      newLogs.push({
        id: `log-${Date.now()}-dl`,
        task_id: taskId,
        user_id: currentUser.id,
        action: "deadline_changed",
        old_value: task.deadline,
        new_value: updates.deadline,
        created_at: new Date().toISOString(),
        user: currentUser,
      });
    }

    if (updates.priority && updates.priority !== task.priority) {
      newLogs.push({
        id: `log-${Date.now()}-pr`,
        task_id: taskId,
        user_id: currentUser.id,
        action: "priority_changed",
        old_value: task.priority,
        new_value: updates.priority,
        created_at: new Date().toISOString(),
        user: currentUser,
      });
    }

    if (updates.assignees) {
      const assigneeNames = updates.assignees.map((a) => a.full_name).join(", ");
      newLogs.push({
        id: `log-${Date.now()}-as`,
        task_id: taskId,
        user_id: currentUser.id,
        action: "task_assigned",
        new_value: `เปลี่ยนผู้รับผิดชอบเป็น: ${assigneeNames}`,
        created_at: new Date().toISOString(),
        user: currentUser,
      });
    }

    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
    const updatedLogs = [...newLogs, ...activityLogs];
    setTasks(updatedTasks);
    setActivityLogs(updatedLogs);
    saveState(updatedTasks, issues, updatedLogs);

    // Persist details to Supabase Cloud
    SupabaseSyncService.saveTask({ id: taskId, ...updates });
  };

  const deleteTask = (taskId: string): { success: boolean; message?: string } => {
    if (currentUser.role !== "admin") {
      return { success: false, message: "เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบงานได้" };
    }
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    const updatedIssues = issues.filter((i) => i.task_id !== taskId);
    const updatedComments = comments.filter((c) => c.task_id !== taskId);
    const updatedAttachments = attachments.filter((a) => a.task_id !== taskId);
    const updatedNotifs = notifications.filter((n) => n.task_id !== taskId);

    setTasks(updatedTasks);
    setIssues(updatedIssues);
    setComments(updatedComments);
    setAttachments(updatedAttachments);
    setNotifications(updatedNotifs);

    saveState(updatedTasks, updatedIssues, activityLogs);
    try {
      localStorage.setItem("taskflow_notifications", JSON.stringify(updatedNotifs));
      localStorage.setItem("taskflow_comments", JSON.stringify(updatedComments));
      localStorage.setItem("taskflow_attachments", JSON.stringify(updatedAttachments));
    } catch {}

    // Delete from Supabase Cloud
    SupabaseSyncService.deleteTask(taskId);

    return { success: true };
  };

  const addIssue = async (taskId: string, description: string, descriptionEn?: string): Promise<TaskIssue> => {
    let finalDescEn = descriptionEn;
    if (!finalDescEn) {
      const trans = await translateText(description);
      finalDescEn = trans.translatedText;
    }

    const newIssue: TaskIssue = {
      id: `issue-${Date.now()}`,
      task_id: taskId,
      issue_description: description,
      issue_description_en: finalDescEn || description,
      raised_by: currentUser.id,
      raised_at: new Date().toISOString(),
      is_resolved: false,
      raised_user: currentUser,
    };

    const updatedIssues = [newIssue, ...issues];
    setIssues(updatedIssues);

    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, unresolved_issues_count: (t.unresolved_issues_count || 0) + 1 } : t
    );
    setTasks(updatedTasks);

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      task_id: taskId,
      user_id: currentUser.id,
      action: "issue_raised",
      new_value: description,
      created_at: new Date().toISOString(),
      user: currentUser,
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    saveState(updatedTasks, updatedIssues, updatedLogs);

    // Persist issue & activity log to Supabase Cloud
    SupabaseSyncService.saveIssue(newIssue);
    SupabaseSyncService.saveActivityLog(newLog);

    const targetTask = tasks.find((t) => t.id === taskId);

    // Create In-App Notification for Blocker with exact task_id linking
    const issueNotif: NotificationItem = {
      id: `notif-${Date.now()}-blocker`,
      user_id: currentUser.id,
      task_id: taskId,
      type: "issue_logged",
      title: "🚨 มีปัญหาติดขัด (Active Blocker)",
      title_en: "🚨 Active Blocker / Issue Reported",
      message: `งาน "${targetTask?.title || "งานในระบบ"}": ${description}`,
      message_en: `Task "${targetTask?.title || "Task"}": ${finalDescEn || description}`,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [issueNotif, ...prev]);

    // Dispatch LINE push to all Admins and Managers with line_user_id
    try {
      const targetExecLineIds = users
        .filter((u) => (u.role === "admin" || u.role === "manager") && u.line_user_id)
        .map((u) => u.line_user_id as string);

      if (targetExecLineIds.length > 0) {
        fetch("/api/line/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientLineUserIds: targetExecLineIds,
            title: "🚨 ปัญหาวิกฤต (Active Blocker) หน้างาน",
            message: description,
            taskTitle: targetTask?.title || "งานในระบบ",
            taskId,
            priority: "urgent",
            senderName: currentUser.full_name,
            projectName: targetTask?.project?.name || "โครงการ",
          }),
        }).catch((err) => console.error("[LINE Multi-Push Blocker Error]:", err));
      }
    } catch {}

    return newIssue;
  };

  const resolveIssue = async (issueId: string, resolution: string, resolutionEn?: string): Promise<void> => {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return;

    let finalResEn = resolutionEn;
    if (!finalResEn) {
      const trans = await translateText(resolution);
      finalResEn = trans.translatedText;
    }

    const updatedIssues = issues.map((i) =>
      i.id === issueId
        ? {
            ...i,
            is_resolved: true,
            resolved_by: currentUser.id,
            resolved_at: new Date().toISOString(),
            resolution_description: resolution,
            resolution_description_en: finalResEn || resolution,
            resolved_user: currentUser,
          }
        : i
    );
    setIssues(updatedIssues);

    const updatedTasks = tasks.map((t) => {
      if (t.id === issue.task_id) {
        const remainingUnresolved = updatedIssues.filter(
          (i) => i.task_id === t.id && !i.is_resolved
        ).length;
        return { ...t, unresolved_issues_count: remainingUnresolved };
      }
      return t;
    });
    setTasks(updatedTasks);

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      task_id: issue.task_id,
      user_id: currentUser.id,
      action: "issue_resolved",
      new_value: resolution,
      created_at: new Date().toISOString(),
      user: currentUser,
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);
    saveState(updatedTasks, updatedIssues, updatedLogs);

    // Auto-resolve / mark as read any blocker notification for this task
    const updatedNotifs = notifications.map((n) =>
      n.task_id === issue.task_id && n.type === "issue_logged" ? { ...n, is_read: true } : n
    );
    setNotifications(updatedNotifs);
    try {
      localStorage.setItem("taskflow_notifications", JSON.stringify(updatedNotifs));
    } catch {}

    // Persist issue resolution & activity log to Supabase Cloud
    SupabaseSyncService.saveIssue({
      id: issueId,
      task_id: issue.task_id,
      issue_description: issue.issue_description,
      is_resolved: true,
      resolved_by: currentUser.id,
      resolved_at: new Date().toISOString(),
      resolution_description: resolution,
    });
    SupabaseSyncService.saveActivityLog(newLog);
  };

  const updatePermitDetails = (taskId: string, updates: Partial<PermitDetails>) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId && t.permit_details) {
        return {
          ...t,
          permit_details: {
            ...t.permit_details,
            ...updates,
          },
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    saveState(updatedTasks, issues, activityLogs);

    // Persist permit details to Supabase Cloud
    SupabaseSyncService.saveTask({ id: taskId }, updates);
  };

  const updatePermitStatus = (taskId: string, newStatus: PermitStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.permit_details) return;

    const oldPermitStatus = task.permit_details.permit_status;
    let newRevisionRound = task.permit_details.revision_round;

    if (newStatus === "needs_revision" && oldPermitStatus !== "needs_revision") {
      newRevisionRound += 1;
    }

    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId && t.permit_details) {
        return {
          ...t,
          permit_details: {
            ...t.permit_details,
            permit_status: newStatus,
            revision_round: newRevisionRound,
          },
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      task_id: taskId,
      user_id: currentUser.id,
      action: "permit_status_changed",
      old_value: oldPermitStatus,
      new_value: newStatus,
      created_at: new Date().toISOString(),
      user: currentUser,
    };

    const updatedLogs = [newLog, ...activityLogs];
    setTasks(updatedTasks);
    setActivityLogs(updatedLogs);
    saveState(updatedTasks, issues, updatedLogs);

    // Persist permit status & activity log to Supabase Cloud directly
    SupabaseSyncService.updatePermitStatus(taskId, newStatus, newRevisionRound);
    SupabaseSyncService.saveActivityLog(newLog);
  };

  const addComment = async (taskId: string, content: string, contentEn?: string): Promise<Comment> => {
    let finalContentEn = contentEn;
    if (!finalContentEn) {
      const trans = await translateText(content);
      finalContentEn = trans.translatedText;
    }

    const newComment: Comment = {
      id: `comm-${Date.now()}`,
      task_id: taskId,
      user_id: currentUser.id,
      content,
      content_en: finalContentEn || content,
      created_at: new Date().toISOString(),
      user: currentUser,
    };
    const updatedComments = [...comments, newComment];
    setComments(updatedComments);

    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      task_id: taskId,
      user_id: currentUser.id,
      action: "comment_added",
      new_value: content.slice(0, 100),
      created_at: new Date().toISOString(),
      user: currentUser,
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);

    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, comments_count: (t.comments_count || 0) + 1 } : t
    );
    setTasks(updatedTasks);
    saveState(updatedTasks, issues, updatedLogs);

    // Persist comment & log to Supabase Cloud
    SupabaseSyncService.saveComment(newComment);
    SupabaseSyncService.saveActivityLog(newLog);

    return newComment;
  };

  const updateComment = async (commentId: string, content: string, contentEn?: string): Promise<void> => {
    let finalContentEn = contentEn;
    if (!finalContentEn) {
      const trans = await translateText(content);
      finalContentEn = trans.translatedText;
    }

    const updatedComments = comments.map((c) =>
      c.id === commentId ? { ...c, content, content_en: finalContentEn || c.content_en } : c
    );
    setComments(updatedComments);
    try {
      localStorage.setItem("taskflow_comments", JSON.stringify(updatedComments));
    } catch {}

    SupabaseSyncService.saveComment({ id: commentId, content, content_en: finalContentEn });
  };

  const deleteComment = async (commentId: string): Promise<void> => {
    const target = comments.find((c) => c.id === commentId);
    const updatedComments = comments.filter((c) => c.id !== commentId);
    setComments(updatedComments);

    if (target) {
      const updatedTasks = tasks.map((t) =>
        t.id === target.task_id ? { ...t, comments_count: Math.max(0, (t.comments_count || 1) - 1) } : t
      );
      setTasks(updatedTasks);
      saveState(updatedTasks, issues, activityLogs);
    }

    try {
      localStorage.setItem("taskflow_comments", JSON.stringify(updatedComments));
    } catch {}

    SupabaseSyncService.deleteComment(commentId);
  };

  const markNotificationAsRead = (notifId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, is_read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const updateLineUserId = (userId: string, lineUserId: string) => {
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, line_user_id: lineUserId } : u));
    setUsers(updatedUsers);
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, line_user_id: lineUserId }));
    }
    saveUsersState(updatedUsers);
    SupabaseSyncService.saveUser({ id: userId, line_user_id: lineUserId });
    try {
      localStorage.setItem("taskflow_line_user_id", lineUserId);
    } catch {}
  };

  const sendMockLinePush = async (
    taskId: string,
    title: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser.line_user_id) {
      return { success: false, error: "ยังไม่ได้ผูกบัญชี LINE (กรุณาใส่ Line User ID ในหน้า Settings)" };
    }
    console.log(`[LINE Push Simulation] Sent to ${currentUser.line_user_id}: ${title} - ${message}`);
    return { success: true };
  };

  // Phase 2: Time Tracking Actions
  const addTimeLog = (taskId: string, entry: Omit<TimeEntry, 'id' | 'created_at'>): TimeEntry => {
    const totalMinutes = (entry.hours || 0) * 60 + (entry.minutes || 0) || entry.duration_minutes || 0;
    const newEntry: TimeEntry = {
      id: `time-${Date.now()}`,
      task_id: taskId,
      user_id: entry.user_id || currentUser.id,
      duration_minutes: totalMinutes,
      hours: entry.hours ?? Math.floor(totalMinutes / 60),
      minutes: entry.minutes ?? (totalMinutes % 60),
      entry_type: entry.entry_type || 'preset',
      note: entry.note || null,
      note_en: entry.note_en || null,
      logged_at: entry.logged_at || new Date().toISOString(),
      created_at: new Date().toISOString(),
      user: users.find(u => u.id === (entry.user_id || currentUser.id)) || currentUser,
    };

    const updatedEntries = [newEntry, ...timeEntries];
    setTimeEntries(updatedEntries);

    // Update task's time_logs and total_time_minutes
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const currentLogs = t.time_logs || [];
        const newLogs = [newEntry, ...currentLogs];
        const newTotalMinutes = newLogs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
        return {
          ...t,
          time_logs: newLogs,
          total_time_minutes: newTotalMinutes,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    setTasks(updatedTasks);

    // Activity Log
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      task_id: taskId,
      user_id: currentUser.id,
      action: "time_logged",
      new_value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      created_at: new Date().toISOString(),
      user: currentUser,
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);

    // Persist time entry to Supabase Cloud
    SupabaseSyncService.saveTimeEntry(newEntry);

    try {
      localStorage.setItem("taskflow_time_entries", JSON.stringify(updatedEntries));
      localStorage.setItem("taskflow_tasks", JSON.stringify(updatedTasks));
      localStorage.setItem("taskflow_logs", JSON.stringify(updatedLogs));
    } catch {}

    return newEntry;
  };

  const deleteTimeLog = (taskId: string, logId: string) => {
    const updatedEntries = timeEntries.filter(e => e.id !== logId);
    setTimeEntries(updatedEntries);

    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const currentLogs = (t.time_logs || []).filter(l => l.id !== logId);
        const newTotalMinutes = currentLogs.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
        return {
          ...t,
          time_logs: currentLogs,
          total_time_minutes: newTotalMinutes,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    setTasks(updatedTasks);

    try {
      localStorage.setItem("taskflow_time_entries", JSON.stringify(updatedEntries));
      localStorage.setItem("taskflow_tasks", JSON.stringify(updatedTasks));
    } catch {}
  };

  // Phase 2: Deliverable & File Attachment Actions
  const addAttachment = (taskId: string, attachment: Omit<TaskAttachment, 'id' | 'created_at'>): TaskAttachment => {
    const newAtt: TaskAttachment = {
      id: `att-${Date.now()}`,
      task_id: taskId,
      file_name: attachment.file_name,
      file_type: attachment.file_type || 'image',
      file_url: attachment.file_url,
      thumbnail_url: attachment.thumbnail_url || attachment.file_url,
      original_size_kb: attachment.original_size_kb,
      compressed_size_kb: attachment.compressed_size_kb,
      saved_percent: attachment.saved_percent || 0,
      uploaded_by: attachment.uploaded_by || currentUser.id,
      created_at: new Date().toISOString(),
      uploader: currentUser,
    };

    const updatedAtts = [newAtt, ...attachments];
    setAttachments(updatedAtts);

    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const currentAtts = t.attachments || [];
        return {
          ...t,
          attachments: [newAtt, ...currentAtts],
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    setTasks(updatedTasks);

    // Activity Log
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      task_id: taskId,
      user_id: currentUser.id,
      action: "file_attached",
      new_value: attachment.file_name,
      created_at: new Date().toISOString(),
      user: currentUser,
    };
    const updatedLogs = [newLog, ...activityLogs];
    setActivityLogs(updatedLogs);

    try {
      localStorage.setItem("taskflow_attachments", JSON.stringify(updatedAtts));
      localStorage.setItem("taskflow_tasks", JSON.stringify(updatedTasks));
      localStorage.setItem("taskflow_logs", JSON.stringify(updatedLogs));
    } catch {}

    // Persist attachment and activity log to Supabase Cloud
    SupabaseSyncService.saveAttachment(newAtt);
    SupabaseSyncService.saveActivityLog(newLog);

    return newAtt;
  };

  const deleteAttachment = (taskId: string, attachmentId: string) => {
    const updatedAtts = attachments.filter(a => a.id !== attachmentId);
    setAttachments(updatedAtts);

    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          attachments: (t.attachments || []).filter(a => a.id !== attachmentId),
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });
    setTasks(updatedTasks);

    try {
      localStorage.setItem("taskflow_attachments", JSON.stringify(updatedAtts));
      localStorage.setItem("taskflow_tasks", JSON.stringify(updatedTasks));
    } catch {}

    // Delete attachment from Supabase Cloud
    SupabaseSyncService.deleteAttachment(attachmentId);
  };

  // Phase 2: Notification Preferences Actions
  const updateNotificationPreferences = (userId: string, prefs: NotificationPreferences) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, notification_preferences: prefs } : u);
    setUsers(updatedUsers);
    if (currentUser.id === userId) {
      setCurrentUser({ ...currentUser, notification_preferences: prefs });
    }
    saveUsersState(updatedUsers);
  };

  return (
    <TaskContext.Provider
      value={{
        currentUser,
        setCurrentUser: (u) => {
          setCurrentUser(u);
          try {
            localStorage.setItem("taskflow_current_user", JSON.stringify(u));
          } catch {}
        },
        isAuthInitialized,
        login,
        logout,
        logUserActivity,
        tasks,
        issues,
        activityLogs,
        comments,
        attachments,
        timeEntries,
        notifications,
        teams,
        users,
        projects,
        addUser,
        updateUser,
        deleteUser,
        addTeam,
        updateTeam,
        deleteTeam,
        resetDefaultTeams,
        addProject,
        updateProject,
        deleteProject,
        createTask,
        updateTaskStatus,
        updateTaskDetails,
        deleteTask,
        addIssue,
        resolveIssue,
        updatePermitDetails,
        updatePermitStatus,
        addComment,
        updateComment,
        deleteComment,
        addTimeLog,
        deleteTimeLog,
        addAttachment,
        deleteAttachment,
        updateNotificationPreferences,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateLineUserId,
        sendMockLinePush,
        isSyncing,
        syncCloudData,
        restoreBackupData,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskStore() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskStore must be used within a TaskProvider");
  }
  return context;
}
