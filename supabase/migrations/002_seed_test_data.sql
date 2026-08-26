-- ====================================================================
-- TaskFlow Manager — Phase 1 Seed Test Data
-- Multi-Tenant Demonstration (Org 1: MeDTree, Org 2: External)
-- ====================================================================

-- 1. Create Organizations
INSERT INTO public.organizations (id, name, created_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'MeDTree Design & Build', now()),
    ('22222222-2222-2222-2222-222222222222', 'External Design Studio', now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Create Teams
INSERT INTO public.teams (id, org_id, name)
VALUES 
    ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'ทีมออกแบบสถาปัตยกรรม'),
    ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'ทีมขออนุญาตก่อสร้างและควบคุมงาน'),
    ('cccccccc-2222-2222-2222-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Studio Team Alpha')
ON CONFLICT (id) DO NOTHING;

-- 3. Projects
INSERT INTO public.projects (id, org_id, team_id, name)
VALUES 
    ('p1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'โครงการบ้านเดี่ยว The Forest Villa'),
    ('p2222222-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'โครงการคอนโดมิเนียมสุขุมวิท 49'),
    ('p3333333-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'cccccccc-2222-2222-2222-cccccccccccc', 'External Project X')
ON CONFLICT (id) DO NOTHING;

-- Note: In production / Supabase Auth, auth.users records will exist.
-- For local seed testing, we simulate records in public.users:
-- (Replace or link with real auth.uid on first user sign in)

-- 4. Sample Tasks for MeDTree
INSERT INTO public.tasks (id, org_id, project_id, category, title, description, status, priority, deadline)
VALUES 
    -- Task 1: Normal design task (In Progress)
    ('t1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 
     'design', 'ออกแบบ Layout แปลนชั้น 1 และแบบบันได', 'ทำ Schematic Design แปลนชั้นล่างเชื่อมต่อสระว่ายน้ำ', 'in_progress', 'high', now() + interval '3 days'),

    -- Task 2: Design task with Blocker / Issue (In Progress with Blocker)
    ('t2222222-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 
     'design', 'แก้แบบโครงสร้างชั้น 3 ติดแนวท่องานระบบ', 'ท่อสุขาภิบาลชนคานโครงสร้างหลัก ต้องปรับลดระดับฝ้าหรือเบี่ยงท่อ', 'in_progress', 'urgent', now() + interval '1 day'),

    -- Task 3: Permit Tracking Task (Under Review / Revision)
    ('t3333333-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'p2222222-1111-1111-1111-111111111111', 
     'permit', 'ยื่นขอใบอนุญาตก่อสร้าง อ.1 (สุขุมวิท 49)', 'ยื่นแบบขออนุญาตกับสำนักงานเขตวัฒนา', 'in_progress', 'urgent', now() + interval '14 days'),

    -- Task 4: Task in Review
    ('t4444444-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 
     'design', 'ส่งแบบ 3D Perspective ห้อง Master Bedroom', 'เรนเดอร์ภาพเสร็จแล้ว ส่งให้ Supervisor ตรวจรับ', 'review', 'medium', now() + interval '2 days'),

    -- Task 5: Completed Task
    ('t5555555-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 
     'design', 'สำรวจพื้นที่หน้างานและเก็บระดับที่ดิน', 'สำรวจหมุดและระดับเสร็จเรียบร้อย', 'completed', 'low', now() - interval '5 days'),

    -- Task 6: External Org Task (To verify RLS boundary)
    ('t6666666-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'p3333333-2222-2222-2222-222222222222', 
     'design', 'External Secret Client Task', 'งานออกแบบของบริษัทภายนอก ห้าม MeDTree เห็น', 'in_progress', 'high', now() + interval '7 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Permit Details for Permit Task (Section 3.8)
INSERT INTO public.permit_details (task_id, permit_type, authority, submitted_date, target_approval_date, revision_round, permit_status)
VALUES (
    't3333333-1111-1111-1111-111111111111',
    'ใบอนุญาตก่อสร้าง (อ.1)',
    'สำนักงานเขตวัฒนา กรุงเทพฯ',
    CURRENT_DATE - interval '10 days',
    CURRENT_DATE + interval '20 days',
    1,
    'needs_revision'
)
ON CONFLICT (task_id) DO UPDATE SET 
    permit_type = EXCLUDED.permit_type,
    authority = EXCLUDED.authority,
    revision_round = EXCLUDED.revision_round,
    permit_status = EXCLUDED.permit_status;
