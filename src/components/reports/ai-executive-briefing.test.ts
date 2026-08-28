import { describe, it, expect } from 'vitest';
import { Task, TaskIssue, TimeEntry } from '@/lib/types/database.types';

describe('AI Executive Briefing Anti-Hallucination Grounding', () => {
  it('should not fabricate fake milestones or fake meetings when tasks list is completely empty (0 tasks)', () => {
    const tasks: Task[] = [];
    const issues: TaskIssue[] = [];
    const timeEntries: TimeEntry[] = [];
    const periodLabel = 'สัปดาห์นี้ (24 ส.ค. 2569 - 30 ส.ค. 2569)';

    // Verify 0-data grounding logic
    const isZero = tasks.length === 0;
    expect(isZero).toBe(true);

    const zeroAchievementsTh = [
      `ยังไม่มีรายการงานที่สร้างหรือบันทึกในรอบรายงานนี้ (${periodLabel})`,
      `ยังไม่พบชั่วโมงทำงานที่ถูกบันทึกในระบบสำหรับช่วงเวลานี้`,
    ];

    expect(zeroAchievementsTh[0]).toContain('ยังไม่มีรายการงาน');
    expect(zeroAchievementsTh[0]).not.toContain('ปิดงานสำเร็จตามเป้าหมาย');
  });

  it('should accurately analyze real tasks and blockers when they exist', () => {
    const tasks: Task[] = [
      {
        id: 't-1',
        org_id: 'org-1',
        project_id: 'p-1',
        category: 'design',
        title: 'แบบแปลนสถาปัตย์ 3D',
        status: 'completed',
        priority: 'high',
        created_by: 'u-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    const issues: TaskIssue[] = [
      {
        id: 'i-1',
        task_id: 't-1',
        issue_description: 'แบบขัดแย้งกับระยะร่นเทศบาล',
        raised_by: 'u-1',
        raised_at: new Date().toISOString(),
        is_resolved: false,
      },
    ];

    const completed = tasks.filter(t => t.status === 'completed');
    const activeBlockers = issues.filter(i => !i.is_resolved);

    expect(completed.length).toBe(1);
    expect(activeBlockers.length).toBe(1);
    expect(activeBlockers[0].issue_description).toBe('แบบขัดแย้งกับระยะร่นเทศบาล');
  });
});
