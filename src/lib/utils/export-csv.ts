import { Task, TimeEntry, TaskIssue } from "@/lib/types/database.types";
import { formatDate, getCategoryLabel, getPriorityLabel, getStatusLabel } from "@/lib/utils";
import { Language } from "@/lib/i18n/translations";

/**
 * Generates and triggers a browser download for a CSV file with UTF-8 BOM.
 * This guarantees proper Thai character display in Microsoft Excel.
 */
export function exportTasksToCSV(
  tasks: Task[],
  timeEntries: TimeEntry[],
  issues: TaskIssue[],
  reportTitle: string = "TaskFlow_Report",
  lang: Language = "th"
) {
  // CSV Headers
  const headers = [
    lang === "th" ? "รหัสงาน" : "Task ID",
    lang === "th" ? "ชื่องาน" : "Task Title",
    lang === "th" ? "โครงการ" : "Project",
    lang === "th" ? "หมวดหมู่งาน" : "Category",
    lang === "th" ? "สถานะ" : "Status",
    lang === "th" ? "ความสำคัญ" : "Priority",
    lang === "th" ? "ผู้รับผิดชอบ" : "Assignees",
    lang === "th" ? "วันกำหนดส่ง" : "Deadline",
    lang === "th" ? "วันที่สร้าง" : "Created At",
    lang === "th" ? "ชั่วโมงทำงานสะสม (ชม.)" : "Logged Hours",
    lang === "th" ? "จำนวนปัญหาติดขัด" : "Issues Count",
    lang === "th" ? "รายละเอียดใบขออนุญาต" : "Permit Info",
  ];

  const rows = tasks.map((task) => {
    // Calculate total hours for this task
    const taskHours = timeEntries
      .filter((t) => t.task_id === task.id)
      .reduce((acc, t) => acc + (t.duration_minutes || 0), 0) / 60;

    const taskIssuesCount = issues.filter((i) => i.task_id === task.id && !i.is_resolved).length;
    const assigneesStr = task.assignees?.map((a) => a.full_name).join(", ") || (lang === "th" ? "ยังไม่ระบุ" : "Unassigned");
    const projectName = task.project?.name || (lang === "th" ? "โครงการทั่วไป" : "General");
    const permitInfo = task.permit_details
      ? `${task.permit_details.permit_type} (${task.permit_details.authority || "-"})`
      : "-";

    return [
      `"${task.id.slice(0, 8)}"`,
      `"${(task.title || "").replace(/"/g, '""')}"`,
      `"${projectName.replace(/"/g, '""')}"`,
      `"${getCategoryLabel(task.category, lang)}"`,
      `"${getStatusLabel(task.status, lang)}"`,
      `"${getPriorityLabel(task.priority, lang)}"`,
      `"${assigneesStr.replace(/"/g, '""')}"`,
      `"${formatDate(task.deadline, lang)}"`,
      `"${formatDate(task.created_at, lang)}"`,
      `"${taskHours.toFixed(1)}"`,
      `"${taskIssuesCount}"`,
      `"${permitInfo.replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  // \uFEFF is UTF-8 BOM
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `${reportTitle}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
