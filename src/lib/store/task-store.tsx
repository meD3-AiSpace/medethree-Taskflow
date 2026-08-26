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

// Rich User Profiles mapped across various construction departments
const defaultUsers: UserProfile[] = [
  {
    id: "u-admin",
    org_id: defaultOrg.id,
    full_name: "สมเกียรติ สถาปัตย์ (MD / Project Director)",
    email: "director@medtree.com",
    role: "admin",
    team_id: "team-consult",
    line_user_id: "Ud03173af920035ad7d808a0feb10327d",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-manager",
    org_id: defaultOrg.id,
    full_name: "วิชัย บริหารงาน (Project Manager / Supervisor)",
    email: "pm@medtree.com",
    role: "manager",
    team_id: "team-construction",
    line_user_id: "Uabcdef1234567890abcdef1234567890",
    created_at: new Date().toISOString(),
  },
  {
    id: "u-designer",
    org_id: defaultOrg.id,
    full_name: "กานดา สถาปนิก (Senior Architect / Design Lead)",
    email: "architect@medtree.com",
    role: "member",
    team_id: "team-design",
    line_user_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "u-site",
    org_id: defaultOrg.id,
    full_name: "ธวัชชัย ช่างคุมงาน (Site Engineer / Supervisor)",
    email: "site.engineer@medtree.com",
    role: "member",
    team_id: "team-construction",
    line_user_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "u-mep",
    org_id: defaultOrg.id,
    full_name: "ประเสริฐ วิศวกรงานระบบ (MEP Engineer)",
    email: "mep@medtree.com",
    role: "member",
    team_id: "team-mep",
    line_user_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "u-qs",
    org_id: defaultOrg.id,
    full_name: "ศิริพร ประมาณราคา (QS / Cost Controller)",
    email: "qs@medtree.com",
    role: "member",
    team_id: "team-qs",
    line_user_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "u-marketing",
    org_id: defaultOrg.id,
    full_name: "อรอนงค์ การตลาด (Marketing & Sales Executive)",
    email: "sales@medtree.com",
    role: "member",
    team_id: "team-marketing",
    line_user_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "u-qa",
    org_id: defaultOrg.id,
    full_name: "ณรงค์เดช ตรวจรับมอบบ้าน (QA/QC Inspector)",
    email: "qa.qc@medtree.com",
    role: "member",
    team_id: "team-qaqc",
    line_user_id: null,
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

// Rich Bilingual Initial Sample Tasks
const initialTasks: Task[] = [
  {
    id: "task-1",
    org_id: defaultOrg.id,
    project_id: "p-1",
    category: "design",
    title: "ออกแบบแปลนชั้น 1 และบันไดหลัก The Forest Villa",
    title_en: "Design 1st Floor Plan and Main Staircase for The Forest Villa",
    description: "ออกแบบ Schematic Design แปลนชั้นล่างเชื่อมต่อสระว่ายน้ำ และระบุระดับบันได",
    description_en: "Schematic Design of ground floor layout connecting to swimming pool and staircase elevation specifications",
    status: "in_progress",
    priority: "high",
    created_by: "u-manager",
    deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    project: defaultProjects[0],
    creator: defaultUsers[1],
    assignees: [defaultUsers[2]],
    comments_count: 2,
    unresolved_issues_count: 0,
  },
  {
    id: "task-2",
    org_id: defaultOrg.id,
    project_id: "p-1",
    category: "design",
    title: "แก้แบบโครงสร้างชั้น 3 ติดแนวท่องานระบบสุขาภิบาล",
    title_en: "Revise 3rd Floor Structural Plan Due to Sanitary Pipe Clash",
    description: "ท่อสุขาภิบาลชนคานโครงสร้างหลัก ต้องปรับระดับฝ้าเพดานหรือเบี่ยงท่องานระบบ",
    description_en: "Sanitary drainage pipe clashing with main structural beam; requires ceiling elevation adjustment or MEP offset",
    status: "in_progress",
    priority: "urgent",
    created_by: "u-manager",
    deadline: new Date(Date.now() + 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    project: defaultProjects[0],
    creator: defaultUsers[1],
    assignees: [defaultUsers[2], defaultUsers[4]],
    comments_count: 1,
    unresolved_issues_count: 1,
  },
  {
    id: "task-3",
    org_id: defaultOrg.id,
    project_id: "p-2",
    category: "permit",
    title: "ยื่นขอใบอนุญาตก่อสร้าง อ.1 (คอนโดมิเนียมสุขุมวิท 49)",
    title_en: "Submit Building Construction Permit Form A.1 (Sukhumvit 49 Condo)",
    description: "ยื่นเอกสารแบบขออนุญาตก่อสร้างอาคารชุด ณ สำนักงานเขตวัฒนา กรุงเทพฯ",
    description_en: "Submit architectural application for condominium construction permit at Watthana District Office, Bangkok",
    status: "in_progress",
    priority: "urgent",
    created_by: "u-admin",
    deadline: new Date(Date.now() + 12 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    project: defaultProjects[1],
    creator: defaultUsers[0],
    assignees: [defaultUsers[0]],
    permit_details: {
      task_id: "task-3",
      permit_type: "ใบอนุญาตก่อสร้าง (อ.1)",
      permit_type_en: "Building Construction Permit (Form A.1)",
      authority: "สำนักงานเขตวัฒนา กรุงเทพฯ",
      authority_en: "Watthana District Office, Bangkok",
      submitted_date: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
      target_approval_date: new Date(Date.now() + 20 * 86400000).toISOString().split("T")[0],
      revision_round: 1,
      permit_status: "needs_revision",
    },
    comments_count: 3,
    unresolved_issues_count: 1,
  },
  {
    id: "task-4",
    org_id: defaultOrg.id,
    project_id: "p-1",
    category: "design",
    title: "ส่งแบบ 3D Perspective ห้อง Master Bedroom",
    title_en: "Submit 3D Perspective Rendering for Master Bedroom",
    description: "เรนเดอร์ภาพ Perspective ความละเอียดสูง 4K ส่งให้ Supervisor ตรวจรับ",
    description_en: "High-resolution 4K architectural perspective rendering submitted for Supervisor sign-off",
    status: "review",
    priority: "medium",
    created_by: "u-manager",
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    project: defaultProjects[0],
    creator: defaultUsers[1],
    assignees: [defaultUsers[2]],
    comments_count: 2,
    unresolved_issues_count: 0,
  },
  {
    id: "task-5",
    org_id: defaultOrg.id,
    project_id: "p-1",
    category: "site",
    title: "สำรวจพื้นที่หน้างานจริงและตรวจระดับหมุดที่ดิน",
    title_en: "Site Survey & Property Boundary Elevation Verification",
    description: "เช็คค่าระดับถนนเทียบกับระดับพื้นโครงการ The Forest Villa",
    description_en: "Inspect finished road elevation level compared to The Forest Villa finished floor level benchmark",
    status: "completed",
    priority: "low",
    created_by: "u-manager",
    deadline: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    project: defaultProjects[0],
    creator: defaultUsers[1],
    assignees: [defaultUsers[3]],
    comments_count: 1,
    unresolved_issues_count: 0,
  },
  {
    id: "task-6",
    org_id: defaultOrg.id,
    project_id: "p-2",
    category: "permit",
    title: "จัดเตรียมเอกสารรายงานผลกระทบสิ่งแวดล้อม (EIA)",
    title_en: "Prepare Environmental Impact Assessment (EIA) Report",
    description: "รวบรวมเล่มเอกสารและรายงานการศึกษาผลกระทบสิ่งแวดล้อม",
    description_en: "Compile documentation and comprehensive study report for environmental impact evaluation",
    status: "assigned",
    priority: "high",
    created_by: "u-admin",
    deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    project: defaultProjects[1],
    creator: defaultUsers[0],
    assignees: [defaultUsers[0]],
    permit_details: {
      task_id: "task-6",
      permit_type: "รายงานผลกระทบสิ่งแวดล้อม (EIA)",
      permit_type_en: "Environmental Impact Assessment (EIA)",
      authority: "สำนักงานนโยบายและแผนทรัพยากรธรรมชาติและสิ่งแวดล้อม (สผ.)",
      authority_en: "Office of Natural Resources and Environmental Policy and Planning (ONEP)",
      submitted_date: null,
      target_approval_date: new Date(Date.now() + 45 * 86400000).toISOString().split("T")[0],
      revision_round: 0,
      permit_status: "preparing",
    },
    comments_count: 0,
    unresolved_issues_count: 0,
  },
];

// Rich Bilingual Issues
const initialIssues: TaskIssue[] = [
  {
    id: "issue-1",
    task_id: "task-2",
    issue_description: "คานคอนกรีตระดับ +3.20m ชนแนวท่อระบายน้ำหลัก ไม่สามารถวางท่อลาดเอียง 1:100 ได้",
    issue_description_en: "Concrete beam at level +3.20m clashes with main drainage pipe; unable to maintain 1:100 slope gradient",
    raised_by: "u-designer",
    raised_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    is_resolved: false,
    raised_user: defaultUsers[2],
  },
  {
    id: "issue-2",
    task_id: "task-3",
    issue_description: "เจ้าหน้าที่เขตแจ้งว่าระยะร่นด้านข้างอาคารฝั่งทิศตะวันออกขาดไป 15 cm ตามข้อบัญญัติ กทม.",
    issue_description_en: "District authority notified that east side setback lacks 15cm under Bangkok Metropolitan Administration building regulation",
    raised_by: "u-admin",
    raised_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    is_resolved: false,
    raised_user: defaultUsers[0],
  },
  {
    id: "issue-3",
    task_id: "task-5",
    issue_description: "พบหมุดหลักเขตที่ดินฝั่งทิศใต้ถูกถมดินทับมองไม่เห็น",
    issue_description_en: "South boundary marker was buried and obscured by landfill elevation",
    raised_by: "u-designer",
    raised_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    is_resolved: true,
    resolved_by: "u-site",
    resolved_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    resolution_description: "ประสานงานเจ้าหน้าที่รังวัดที่ดินใช้เครื่องมือค้นหาและปักหมุดชั่วคราวแล้ว",
    resolution_description_en: "Coordinated with land survey officers to trace boundary and installed certified temporary benchmark",
    raised_user: defaultUsers[2],
    resolved_user: defaultUsers[3],
  },
];

const initialActivityLogs: ActivityLog[] = [
  {
    id: "log-1",
    task_id: "task-1",
    user_id: "u-manager",
    action: "status_changed",
    old_value: "assigned",
    new_value: "in_progress",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    user: defaultUsers[1],
  },
  {
    id: "log-2",
    task_id: "task-2",
    user_id: "u-manager",
    action: "priority_changed",
    old_value: "high",
    new_value: "urgent",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    user: defaultUsers[1],
  },
  {
    id: "log-3",
    task_id: "task-3",
    user_id: "u-admin",
    action: "permit_status_changed",
    old_value: "under_review",
    new_value: "needs_revision",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    user: defaultUsers[0],
  },
];

const initialComments: Comment[] = [
  {
    id: "comm-1",
    task_id: "task-1",
    user_id: "u-designer",
    content: "กำลังจัดวางบันไดแบบ Double Flight เชื่อมกับโถงต้อนรับครับ",
    content_en: "Currently designing double-flight staircase layout connected to the main entrance foyer.",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    user: defaultUsers[2],
  },
  {
    id: "comm-2",
    task_id: "task-4",
    user_id: "u-designer",
    content: "แนบภาพเรนเดอร์ perspective 4k มุมมองหลักและ Walk-in closet เรียบร้อยแล้วครับ รบกวนตรวจรับครับ",
    content_en: "Attached 4K perspective renderings for master bedroom and walk-in closet. Ready for supervisor inspection.",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    user: defaultUsers[2],
  },
];

const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    user_id: "u-designer",
    task_id: "task-2",
    type: "issue_logged",
    title: "มีปัญหาติดขัดใหม่",
    title_en: "New Blocker / Issue Logged",
    message: "งานแก้แบบโครงสร้างชั้น 3 ติดแนวท่องานระบบ มีการแจ้งติดปัญหา",
    message_en: "Revise 3rd floor structural plan: new blocker issue reported regarding MEP clash.",
    is_read: false,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "notif-2",
    user_id: "u-admin",
    task_id: "task-3",
    type: "status_changed",
    title: "ใบขออนุญาตถูกตีกลับแก้ไข",
    title_en: "Building Permit Revision Required",
    message: "ใบอนุญาตก่อสร้าง อ.1 สำนักงานเขตวัฒนา มีคำสั่งให้แก้ไขระยะร่น",
    message_en: "Building Permit A.1 (Watthana District Office): revision required for eastern building setback.",
    is_read: false,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// Phase 2: Initial Attachments Mock Data (with Compression Stats)
const initialAttachments: TaskAttachment[] = [
  {
    id: "att-1",
    task_id: "task-1",
    file_name: "FloorPlan_L1_ForestVilla_Rev2.pdf",
    file_type: "pdf",
    file_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
    original_size_kb: 4520,
    compressed_size_kb: 4520,
    saved_percent: 0,
    uploaded_by: "u-designer",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    uploader: defaultUsers[2],
  },
  {
    id: "att-2",
    task_id: "task-4",
    file_name: "Perspective_MasterBedroom_4K.jpg",
    file_type: "image",
    file_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=80",
    original_size_kb: 12400,
    compressed_size_kb: 340,
    saved_percent: 97,
    uploaded_by: "u-designer",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    uploader: defaultUsers[2],
  },
  {
    id: "att-3",
    task_id: "task-5",
    file_name: "Site_Survey_Boundary_Photo.jpg",
    file_type: "image",
    file_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=1600&q=80",
    thumbnail_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=400&q=80",
    original_size_kb: 8900,
    compressed_size_kb: 280,
    saved_percent: 96,
    uploaded_by: "u-site",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    uploader: defaultUsers[3],
  },
];

// Phase 2: Initial Time Log Entries Mock Data (Friendly Work Log)
const initialTimeEntries: TimeEntry[] = [
  {
    id: "time-1",
    task_id: "task-1",
    user_id: "u-designer",
    duration_minutes: 120,
    hours: 2,
    minutes: 0,
    entry_type: "preset",
    note: "จัดวางแปลนผังพื้นชั้น 1 และกำหนดระยะขั้นบันได",
    note_en: "Arranging 1st floor layout and specifying staircase tread/riser dimensions",
    logged_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    user: defaultUsers[2],
  },
  {
    id: "time-2",
    task_id: "task-1",
    user_id: "u-designer",
    duration_minutes: 60,
    hours: 1,
    minutes: 0,
    entry_type: "timer",
    note: "ปรับระยะเสาและแนวท่อสุขาภิบาล",
    note_en: "Adjusting column spacing and sanitary pipe path",
    logged_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    user: defaultUsers[2],
  },
  {
    id: "time-3",
    task_id: "task-2",
    user_id: "u-mep",
    duration_minutes: 90,
    hours: 1,
    minutes: 30,
    entry_type: "manual",
    note: "ตรวจสอบแนวท่อน้ำทิ้งและจำลองระดับฝ้าเพดาน",
    note_en: "Checking wastewater pipe route and simulating ceiling cavity clearance",
    logged_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    user: defaultUsers[4],
  },
];

interface TaskContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
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
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  // User Management Actions
  addUser: (userData: { full_name: string; email: string; role: UserRole; team_id?: string; line_user_id?: string }) => UserProfile;
  updateUser: (userId: string, updates: Partial<UserProfile>) => void;
  deleteUser: (userId: string) => { success: boolean; message?: string };
  // Team Management Actions
  addTeam: (name: string, nameEn?: string, description?: string) => Team;
  updateTeam: (teamId: string, name: string, nameEn?: string, description?: string) => void;
  deleteTeam: (teamId: string) => { success: boolean; message?: string };
  resetDefaultTeams: () => void;
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
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(defaultUsers[0]);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [issues, setIssues] = useState<TaskIssue[]>(initialIssues);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [attachments, setAttachments] = useState<TaskAttachment[]>(initialAttachments);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(initialTimeEntries);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [users, setUsers] = useState<UserProfile[]>(defaultUsers);
  const [teams, setTeams] = useState<Team[]>(defaultTeams);
  const [projects] = useState<Project[]>(defaultProjects);
  const [geminiApiKey, setGeminiApiKeyState] = useState("AIzaSyC6mSrD6cAq1vqaWgbBrI1MHWydh26VmLs");

  // Load from localStorage if available
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem("taskflow_tasks");
      const savedIssues = localStorage.getItem("taskflow_issues");
      const savedLogs = localStorage.getItem("taskflow_logs");
      const savedUsers = localStorage.getItem("taskflow_users");
      const savedTeams = localStorage.getItem("taskflow_teams");
      const savedAttachments = localStorage.getItem("taskflow_attachments");
      const savedTimeEntries = localStorage.getItem("taskflow_time_entries");
      const savedUser = localStorage.getItem("taskflow_current_user");
      const savedKey = localStorage.getItem("taskflow_gemini_api_key");

      if (savedKey) setGeminiApiKeyState(savedKey);
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      if (savedAttachments) setAttachments(JSON.parse(savedAttachments));
      if (savedTimeEntries) setTimeEntries(JSON.parse(savedTimeEntries));
      if (savedTeams) {
        const parsed = JSON.parse(savedTeams);
        // If saved teams has less than 8 teams, merge with new complete housing list
        if (parsed.length < 8) {
          setTeams(defaultTeams);
          localStorage.setItem("taskflow_teams", JSON.stringify(defaultTeams));
        } else {
          setTeams(parsed);
        }
      } else {
        localStorage.setItem("taskflow_teams", JSON.stringify(defaultTeams));
      }

      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedIssues) setIssues(JSON.parse(savedIssues));
      if (savedLogs) setActivityLogs(JSON.parse(savedLogs));
      if (savedUser) {
        const parsedUsers = savedUsers ? JSON.parse(savedUsers) : defaultUsers;
        const found = parsedUsers.find((u: UserProfile) => u.id === savedUser);
        if (found) setCurrentUser(found);
      }
    } catch {
      // fallback
    }
  }, []);

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    try {
      localStorage.setItem("taskflow_gemini_api_key", key);
    } catch {}
  };

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

  // User Management
  const addUser = (userData: {
    full_name: string;
    email: string;
    role: UserRole;
    team_id?: string;
    line_user_id?: string;
  }): UserProfile => {
    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      org_id: defaultOrg.id,
      full_name: userData.full_name,
      email: userData.email,
      role: userData.role,
      team_id: userData.team_id || teams[0]?.id || "team-design",
      line_user_id: userData.line_user_id || null,
      created_at: new Date().toISOString(),
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveUsersState(updatedUsers);
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<UserProfile>) => {
    const updatedUsers = users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
    setUsers(updatedUsers);
    saveUsersState(updatedUsers);

    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }

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
    const updatedUsers = users.filter((u) => u.id !== userId);
    setUsers(updatedUsers);
    saveUsersState(updatedUsers);

    if (currentUser.id === userId && updatedUsers.length > 0) {
      setCurrentUser(updatedUsers[0]);
    }
    return { success: true };
  };

  // Team Management
  const addTeam = (name: string, nameEn?: string, description?: string): Team => {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      org_id: defaultOrg.id,
      name,
      name_en: nameEn || name,
      description: description || "",
      created_at: new Date().toISOString(),
    };
    const updatedTeams = [...teams, newTeam];
    setTeams(updatedTeams);
    saveTeamsState(updatedTeams);
    return newTeam;
  };

  const updateTeam = (teamId: string, name: string, nameEn?: string, description?: string) => {
    const updatedTeams = teams.map((t) => (t.id === teamId ? { ...t, name, name_en: nameEn || t.name_en, description: description || t.description } : t));
    setTeams(updatedTeams);
    saveTeamsState(updatedTeams);
  };

  const deleteTeam = (teamId: string): { success: boolean; message?: string } => {
    if (teams.length <= 1) {
      return { success: false, message: "ไม่สามารถลบทีมสุดท้ายได้" };
    }
    const updatedTeams = teams.filter((t) => t.id !== teamId);
    setTeams(updatedTeams);
    saveTeamsState(updatedTeams);
    return { success: true };
  };

  const createTask = async (taskData: Partial<Task>, permitData?: Partial<PermitDetails>): Promise<Task> => {
    const taskId = `task-${Date.now()}`;
    const project = projects.find((p) => p.id === taskData.project_id) || projects[0];

    let titleEn = taskData.title_en;
    let descEn = taskData.description_en;

    if (!titleEn && taskData.title) {
      const trans = await translateText(taskData.title, geminiApiKey);
      titleEn = trans.translatedText;
    }
    if (!descEn && taskData.description) {
      const trans = await translateText(taskData.description, geminiApiKey);
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
        const trans = await translateText(permitData.permit_type, geminiApiKey);
        permitTypeEn = trans.translatedText;
      }
      if (!authorityEn && permitData?.authority) {
        const trans = await translateText(permitData.authority, geminiApiKey);
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
      task: { ...task, comments_count: taskCommentsCount },
      targetStatus: newStatus,
      userRole: currentUser.role,
      userId: currentUser.id,
      hasOutputCommentOrAttachment: taskCommentsCount > 0,
      hasAssigneeAndDeadline: !!(task.assignees && task.assignees.length > 0 && task.deadline),
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
      id: `log-${Date.now()}`,
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

    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
    const updatedLogs = [...newLogs, ...activityLogs];
    setTasks(updatedTasks);
    setActivityLogs(updatedLogs);
    saveState(updatedTasks, issues, updatedLogs);
  };

  const deleteTask = (taskId: string): { success: boolean; message?: string } => {
    if (currentUser.role !== "admin") {
      return { success: false, message: "เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถลบงานได้" };
    }
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);
    saveState(updatedTasks, issues, activityLogs);
    return { success: true };
  };

  const addIssue = async (taskId: string, description: string, descriptionEn?: string): Promise<TaskIssue> => {
    let finalDescEn = descriptionEn;
    if (!finalDescEn) {
      const trans = await translateText(description, geminiApiKey);
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
      id: `log-${Date.now()}`,
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

    return newIssue;
  };

  const resolveIssue = async (issueId: string, resolution: string, resolutionEn?: string): Promise<void> => {
    const issue = issues.find((i) => i.id === issueId);
    if (!issue) return;

    let finalResEn = resolutionEn;
    if (!finalResEn) {
      const trans = await translateText(resolution, geminiApiKey);
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

    const updatedTasks = tasks.map((t) =>
      t.id === issue.task_id
        ? { ...t, unresolved_issues_count: Math.max(0, (t.unresolved_issues_count || 1) - 1) }
        : t
    );
    setTasks(updatedTasks);

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
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
      id: `log-${Date.now()}`,
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
  };

  const addComment = async (taskId: string, content: string, contentEn?: string): Promise<Comment> => {
    let finalContentEn = contentEn;
    if (!finalContentEn) {
      const trans = await translateText(content, geminiApiKey);
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

    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, comments_count: (t.comments_count || 0) + 1 } : t
    );
    setTasks(updatedTasks);
    saveState(updatedTasks, issues, activityLogs);
    return newComment;
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
            localStorage.setItem("taskflow_current_user", u.id);
          } catch {}
        },
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
        geminiApiKey,
        setGeminiApiKey,
        addUser,
        updateUser,
        deleteUser,
        addTeam,
        updateTeam,
        deleteTeam,
        resetDefaultTeams,
        createTask,
        updateTaskStatus,
        updateTaskDetails,
        deleteTask,
        addIssue,
        resolveIssue,
        updatePermitDetails,
        updatePermitStatus,
        addComment,
        addTimeLog,
        deleteTimeLog,
        addAttachment,
        deleteAttachment,
        updateNotificationPreferences,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateLineUserId,
        sendMockLinePush,
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
