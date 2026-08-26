# TaskFlow Manager — เอกสารสเปคทางเทคนิค (Technical Specification)
### สำหรับป้อนให้ AI Coding Tools สร้างเวปแอปได้โดยตรง (Claude Code / Google Antigravity / ChatGPT Codex)

**เวอร์ชัน:** 1.0
**วันที่จัดทำ:** 25 สิงหาคม 2569

---

## 0. วิธีใช้เอกสารนี้ (สำคัญ — อ่านก่อน)

เอกสารนี้เขียนในรูปแบบที่ AI coding tool (LLM-based) อ่านแล้ว "แปลงเป็นโค้ด" ได้ทันที เพราะมีองค์ประกอบครบ 4 อย่างที่ AI ต้องการเพื่อสร้างแอปได้แม่นยำ:

1. **Data Model ที่ชัดเจน** (ตาราง, ฟิลด์, ความสัมพันธ์)
2. **User flow / state machine ที่ชัดเจน** (ไม่ใช่แค่ feature list)
3. **Information Architecture** (มีหน้าอะไรบ้าง แต่ละหน้าทำอะไร)
4. **ขอบเขตชัดเจนว่า Phase ไหนทำอะไร** (กัน AI สร้างเกินขอบเขตหรือลืมบางส่วน)

**คำแนะนำการใช้งานจริง:** อย่าวางเอกสารทั้งหมดแล้วสั่ง "สร้างให้เสร็จทีเดียว" — ให้ป้อนทีละ Phase ตามข้อ 9 ด้านล่าง แล้วให้ AI สร้าง, รัน, ทดสอบ, แก้ ก่อนไป Phase ถัดไป จะได้ผลลัพธ์ที่ใช้งานได้จริงมากกว่าการขอทีเดียวทั้งระบบ

---

## 1. ภาพรวมโปรเจกต์ (Project Overview)

**ชื่อโปรเจกต์:** TaskFlow Manager

**ปัญหาที่ต้องแก้ (Problem Statement):**
งานในองค์กรกระจายอยู่หลายที่ — บางงานอยู่ในแชท บางงานอยู่ใน Excel บางงานอยู่ในอีเมล บางงานอยู่ในหัวของใครบางคน ทำให้หัวหน้าต้องไล่ถามซ้ำว่า "งานถึงไหนแล้ว / ใครรับผิดชอบ / เสร็จหรือยัง" ความไม่ชัดเจนนี้คือ "ต้นทุนแฝง" ขององค์กร

**Core Value Proposition:** *Operational Visibility*
เปลี่ยนวัฒนธรรมการทำงานจาก **"หัวหน้าคอยถามว่างานถึงไหนแล้ว"** ไปเป็น **"ทุกคนเห็นความคืบหน้าได้ด้วยตัวเอง"** โดยไม่ต้องประชุมหรือรอรายงานปลายสัปดาห์

**เป้าหมายที่ระบบต้องตอบได้ทันทีที่เปิดหน้า Dashboard (นี่คือ acceptance criteria หลักของทั้งโปรเจกต์):**
- งานไหนเสี่ยงล่าช้า (at risk / overdue)
- งานไหนค้างอยู่ (ไม่มีความเคลื่อนไหว)
- ทีมไหนโหลดงานมากเกินไป (overloaded)
- ภาพรวมทั้งหมด โดยไม่ต้องรอรายงานปลายสัปดาห์

**สถานะโปรเจกต์ & ทิศทางธุรกิจ:**
- เป็นแอป **แยกต่างหากจาก Medethree ERP** โดยสิ้นเชิง — คนละ Supabase project, คนละ login, คนละฐานข้อมูล ไม่แชร์ทรัพยากรกัน
- เริ่มใช้งาน**ภายในทีม MeDTree ก่อน** แต่ออกแบบ schema ให้รองรับ **multi-tenant SaaS** ตั้งแต่ต้น เพราะมีแผนขาย/ให้บริษัทอื่นใช้งานในอนาคต — นี่คือเหตุผลที่ Data Model ในข้อ 5 มีตาราง `organizations` เป็นชั้นบนสุด ไม่ใช่แค่ teams/projects เฉยๆ (ถ้าไม่ทำตั้งแต่แรก การ retrofit multi-tenancy ทีหลังจะแก้ยากและเสี่ยงข้อมูลรั่วข้ามบริษัท)

---

## 2. User Roles & Permissions

| Role | สิทธิ์ |
|---|---|
| **Admin** | จัดการผู้ใช้/ทีม, ตั้งค่าระบบ, เห็นทุกโปรเจกต์ทุกทีม |
| **Manager/Supervisor** | สร้างงาน, มอบหมายงาน, ตั้ง Deadline/Priority, เห็น Dashboard ของทีมตนเอง, ปิดงาน (Review → Completed) |
| **Team Member** | เห็นเฉพาะ "My Tasks", เปลี่ยนสถานะงานตนเอง, คอมเมนต์, แนบไฟล์ — **ไม่สามารถแก้ deadline/priority ที่ตนเองไม่ได้ตั้ง** |
| **Viewer** (optional, Phase 3) | สิทธิ์อ่านอย่างเดียว สำหรับผู้บริหารระดับสูงที่อยากดูภาพรวมแต่ไม่ยุ่งกับงาน |

> หมายเหตุการออกแบบ: การแยกสิทธิ์นี้คือสิ่งที่ AI มักลืมถ้าไม่ระบุไว้ล่วงหน้า — ควรใส่ role-based access control (RBAC) ไว้ตั้งแต่ schema เริ่มต้น ไม่ใช่ค่อยแปะทีหลัง

---

## 3. Core Features (Functional Requirements)

### 3.1 Dashboard (หน้าแรกหลัง Login)
ต้องแสดงโดยไม่ต้องคลิกเพิ่ม:
- จำนวนงานแยกตามสถานะ (To Do / In Progress / Review / Completed / Overdue)
- รายการ "งานเสี่ยงล่าช้า" (ใกล้ deadline แต่ยังไม่คืบหน้า)
- รายการ "งานค้าง" (ไม่มี activity update เกิน X วัน — ตั้งค่าได้)
- Workload ต่อทีม/ต่อคน (กราฟแท่งจำนวนงานที่ถืออยู่)
- Widget แบบ real-time ไม่ต้อง refresh หน้าเอง

### 3.2 Task Management
แต่ละ Task ต้องมี:
- ชื่องาน, รายละเอียด, ผู้สร้าง, ผู้รับผิดชอบ (assignee — รองรับได้มากกว่า 1 คน)
- Deadline, Priority (Low/Medium/High/Urgent)
- สถานะ (ดูข้อ 4 Workflow)
- ไฟล์แนบ/รูปภาพ
- ความสัมพันธ์กับ Project/ทีม ที่งานนั้นสังกัดอยู่

### 3.3 มุมมองจัดระเบียบงาน: Board / List / Calendar
งานชุดเดียวกัน ต้องสลับดูได้ 3 มุมมองจากปุ่มเดียวกันในหน้าเดียว (ไม่ใช่ 3 หน้าแยก):
- **Board (Kanban):** คอลัมน์ตามสถานะ, ลาก-วาง (drag & drop) เพื่อเปลี่ยนสถานะ, กรองได้ตามทีม/คน/priority
- **List:** ตารางรายการงาน เรียง/กรอง/ค้นหาได้ เหมาะกับดูงานจำนวนมากรวดเดียว (ใกล้เคียงความคุ้นเคยแบบ Excel ที่ผู้ใช้ถนัดอยู่แล้ว — ดูข้อ 11)
- **Calendar:** แสดงงานตามวัน deadline เป็นปฏิทินรายเดือน/สัปดาห์ สีของงานแยกตาม priority หรือสถานะ ช่วยเห็นภาพว่าสัปดาห์ไหนงานชนกันเยอะ

การเปลี่ยนสถานะจากมุมมองไหนก็ตาม (เช่น ลากใน Board) ต้อง trigger การบันทึก Activity Log ทันที (ดูข้อ 3.5)

### 3.4 Notification System
แจ้งเตือนอัตโนมัติเมื่อ:
- มีงานใหม่ถูก assign ให้ตัวเอง
- งานใกล้ครบกำหนด (เช่น เหลือ 1 วัน — ตั้งค่าได้)
- งานเลยกำหนดแล้ว (overdue)
- มีคอมเมนต์ใหม่ในงานที่ตนเองเกี่ยวข้อง
- ช่องทาง (เรียงตามความสำคัญที่ตกลงกันไว้): **in-app notification + LINE Notify/LINE OA ต้องมีตั้งแต่ Phase 1** (ช่องทางหลักที่ผู้ใช้จะเห็นจริง), อีเมลเป็น Phase 2 (สำรอง/ใช้กับรายงานทางการมากกว่าแจ้งเตือนรายวัน)
- **หมายเหตุทางเทคนิคสำหรับ LINE:** ต้องให้ user ผูกบัญชี LINE ของตนเองกับ user ในระบบ (เก็บ `line_user_id` ในตาราง users) ก่อนถึงจะส่งแจ้งเตือนได้ — แนะนำใช้ LINE Messaging API (push message ผ่าน LINE OA) แทน LINE Notify แบบเดิม เพราะ LINE Notify (personal token) มีแผนถูก LINE ยกเลิกบริการ ควรวางสถาปัตยกรรมให้ยืดหยุ่นพอจะสลับผู้ให้บริการแจ้งเตือนได้ (Notification Adapter pattern — แยก interface กลาง แล้วมี provider ย่อยเป็น LINE/Email/In-app)

### 3.5 Comment & Activity Log
- คอมเมนต์แบบ thread ในแต่ละ Task
- Activity Log บันทึกอัตโนมัติทุกการเปลี่ยนแปลง (ใครเปลี่ยนสถานะ, ใครแก้ deadline, ใครมอบหมายใหม่) — **ห้ามให้ user แก้ไข/ลบ log ได้** เพื่อรักษาความน่าเชื่อถือของประวัติงาน

### 3.6 Reports
- สรุปผลงานรายวัน/รายสัปดาห์/รายเดือน
- Export เป็น PDF/Excel
- กรองตามทีม/โปรเจกต์/ช่วงเวลา

### 3.7 Issue / Blocker Log (ฟีเจอร์แก้ pain point เฉพาะของแผนกออกแบบ)
**ที่มา:** ปัญหาที่ผู้ใช้ระบุเจาะจงคือ ไม่มีที่บันทึกว่า "ติดปัญหาอะไร → แก้ไขแล้วหรือยัง → ใครแก้ → แก้อย่างไร" ทำให้ต้องถามซ้ำด้วยปากเปล่าตลอดเวลา โดยเฉพาะเรื่องใบขออนุญาตก่อสร้าง

**หลักการออกแบบ:** ไม่สร้างเป็นระบบแยกต่างหาก แต่เพิ่มเป็น "log ปัญหา" แนบกับ Task ใดก็ได้ (ใช้ได้ทั้งงานออกแบบทั่วไปและใบขออนุญาต) เพื่อไม่ให้แอปใหญ่/ซับซ้อนเกินจำเป็น — เป็นแค่ tab เพิ่มในหน้า Task เดิม แยกจาก Comment ทั่วไป เพราะ Comment คือพูดคุย ส่วนนี้คือ "บันทึกปัญหาที่ต้องปิดให้ได้"

แต่ละ Issue ที่บันทึกในงานหนึ่งๆ ต้องมี:
- คำอธิบายปัญหา (ติดปัญหาอะไร) — ใครเจอ, เจอเมื่อไหร่
- สถานะ: ยังไม่แก้ / แก้แล้ว
- คนที่แก้ไข (ถ้าแก้แล้ว)
- คำอธิบายวิธีแก้ (แก้ไขอย่างไร)
- วันที่แก้เสร็จ

Dashboard ต้องมี widget แยกต่างหากชื่อ **"งานที่ติดปัญหาอยู่"** (ต่างจาก "งานเสี่ยงล่าช้า" ในข้อ 3.1 เพราะติดปัญหา ≠ แค่ใกล้ deadline — งานอาจยังไม่ใกล้ deadline แต่ติดปัญหาที่ต้องรีบแก้ก็ได้)

### 3.8 Permit Tracking — การติดตามใบขออนุญาตก่อสร้าง (โมดูลเฉพาะ)
**เหตุผลที่แยกจาก Task ทั่วไป:** ใบขออนุญาตมีวงจรชีวิตต่างจากงานออกแบบทั่วไป เพราะขึ้นกับหน่วยงานราชการภายนอก (ควบคุมเวลาเองไม่ได้), มักถูกตีกลับให้แก้หลายรอบ, และใช้เวลานานเป็นสัปดาห์/เดือน — ใช้สถานะแบบ Todo/In Progress/Done ธรรมดาไม่พอ

**เมื่อสร้าง Task แล้วเลือกหมวด "ใบขออนุญาต" ระบบต้องขอข้อมูลเพิ่ม:**
- ประเภทใบอนุญาต (เช่น ใบอนุญาตก่อสร้าง, ต่อเติม, EIA)
- หน่วยงานที่ยื่น (เช่น เทศบาล, อบต., อบจ.)
- วันที่ยื่นขอ
- วันที่คาดว่าจะได้รับอนุมัติ
- จำนวนรอบที่ถูกตีกลับให้แก้ไข (นับอัตโนมัติทุกครั้งที่เข้าสถานะ "รอแก้ไข")

**สถานะเฉพาะของใบขออนุญาต (แยกจาก status ของ Task ทั่วไป):**
เตรียมเอกสาร → ยื่นขอแล้ว → รอหน่วยงานพิจารณา → ติดปัญหา/รอแก้ไขตามคำสั่ง → อนุมัติแล้ว / ถูกปฏิเสธ

หน้า Kanban ควรมี "โหมดดูใบขออนุญาต" แยกต่างหาก ที่ใช้คอลัมน์ตามสถานะชุดนี้แทนสถานะ Task ทั่วไป กรองเฉพาะงานหมวดใบขออนุญาตเท่านั้น

### 3.9 Time Tracking (บันทึกเวลาทำงาน)
- แต่ละ Task มีปุ่ม "เริ่มจับเวลา / หยุด" ให้กดตอนเริ่ม-เลิกทำงานจริง **และ**ให้กรอกเวลาย้อนหลังเองได้ (manual entry) เสมอ — **ห้ามบังคับให้ต้องกดจับเวลาสดเท่านั้น** เพราะขัดกับหลักการลดแรงต้านผู้ใช้ในข้อ 11 (คนลืมกดบ่อย ควรแก้ไขเวลาย้อนหลังได้ง่ายไม่โดนตำหนิ)
- แต่ละรายการเวลาผูกกับ task + คนที่บันทึก + หมายเหตุสั้นๆ (ไม่บังคับ)
- สรุปรวมเวลาที่ใช้ต่อ task / ต่อคน / ต่อโปรเจกต์ แสดงในหน้า Reports (ข้อ 3.6) และ Dashboard (ข้อ 3.1) — ใช้วิเคราะห์ว่างานไหนใช้เวลาจริงเกินที่ประเมินไว้

---

## 4. Core Workflow (State Machine)

```
Create Task → Assign → In Progress → Review → Completed
```

กติกาการเปลี่ยนสถานะ (ต้องเขียนเป็น validation logic ไม่ใช่ปล่อยให้ผู้ใช้กดข้ามได้อิสระ):

| จาก | ไป | ใครทำได้ | เงื่อนไข |
|---|---|---|---|
| Create Task | Assigned | Manager/Admin | ต้องระบุ assignee + deadline ก่อน |
| Assigned | In Progress | Assignee | อัตโนมัติเมื่อ assignee เปิดงานครั้งแรก หรือกดเริ่มงานเอง |
| In Progress | Review | Assignee | ต้องมี output อย่างน้อย 1 อย่าง (ไฟล์/คอมเมนต์สรุป) |
| Review | Completed | Manager/Admin เท่านั้น | ผู้ตรวจสอบกดปิดงาน |
| Review | In Progress | Manager/Admin | กรณีตีกลับให้แก้ไข |

ทุกการเปลี่ยนสถานะ → เขียนลง Activity Log อัตโนมัติ พร้อม timestamp + user_id

---

## 5. Data Model (Database Schema)

แนะนำ PostgreSQL (เข้ากับ Supabase ที่ใช้อยู่แล้วในโปรเจกต์ Medethree ERP ของผู้ใช้ — ถ้าต้องการ ใช้ instance เดียวกันคนละ schema ได้)

```sql
-- องค์กร/บริษัทที่ใช้งานระบบ — เป็นชั้นบนสุดของทุกตาราง (multi-tenant boundary)
-- ตอนเปิดตัว MeDTree จะเป็น organization แถวเดียวในระบบ แต่โครงสร้างพร้อมรับบริษัทอื่นได้ทันทีโดยไม่ต้องแก้ schema
organizations (
  id uuid primary key,
  name text,
  created_at timestamptz default now()
)

-- ผู้ใช้งาน (เชื่อมกับ Supabase Auth)
users (
  id uuid primary key,
  org_id uuid references organizations(id) not null,
  line_user_id text,             -- สำหรับผูกบัญชี LINE รับแจ้งเตือน (ดูข้อ 3.4)
  full_name text,
  email text unique,
  role text check (role in ('admin','manager','member','viewer')),
  team_id uuid references teams(id),
  created_at timestamptz default now()
)

teams (
  id uuid primary key,
  org_id uuid references organizations(id) not null,
  name text,
  created_at timestamptz default now()
)

projects (
  id uuid primary key,
  org_id uuid references organizations(id) not null,
  name text,
  team_id uuid references teams(id),
  created_at timestamptz default now()
)

tasks (
  id uuid primary key,
  org_id uuid references organizations(id) not null,   -- denormalized เพื่อให้เขียน RLS policy ง่าย/เร็วกว่า join ผ่าน project
  project_id uuid references projects(id),
  category text check (category in ('design','permit','site','other')) default 'design',  -- ใช้แยกงานออกแบบทั่วไป vs ใบขออนุญาต
  title text not null,
  description text,
  status text check (status in ('todo','assigned','in_progress','review','completed')) default 'todo',
  priority text check (priority in ('low','medium','high','urgent')) default 'medium',
  created_by uuid references users(id),
  deadline timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

task_assignees (
  task_id uuid references tasks(id),
  user_id uuid references users(id),
  primary key (task_id, user_id)
)

comments (
  id uuid primary key,
  task_id uuid references tasks(id),
  user_id uuid references users(id),
  content text,
  created_at timestamptz default now()
)

attachments (
  id uuid primary key,
  task_id uuid references tasks(id),
  file_url text,
  uploaded_by uuid references users(id),
  created_at timestamptz default now()
)

activity_log (
  id uuid primary key,
  task_id uuid references tasks(id),
  user_id uuid references users(id),
  action text,          -- e.g. 'status_changed', 'assigned', 'deadline_changed'
  old_value text,
  new_value text,
  created_at timestamptz default now()
)

-- บันทึกปัญหา/สิ่งที่ติดขัด แนบกับ task ใดก็ได้ (ข้อ 3.7)
task_issues (
  id uuid primary key,
  task_id uuid references tasks(id),
  issue_description text,             -- ติดปัญหาอะไร
  raised_by uuid references users(id),
  raised_at timestamptz default now(),
  is_resolved boolean default false,
  resolved_by uuid references users(id),
  resolved_at timestamptz,
  resolution_description text         -- แก้ไขอย่างไร
)

-- ข้อมูลเฉพาะของ task ที่ category = 'permit' เท่านั้น (ข้อ 3.8)
permit_details (
  task_id uuid primary key references tasks(id),
  permit_type text,                   -- เช่น ใบอนุญาตก่อสร้าง, ต่อเติม, EIA
  authority text,                     -- หน่วยงานที่ยื่น เช่น เทศบาล, อบต.
  submitted_date date,
  target_approval_date date,
  revision_round integer default 0,   -- นับรอบที่ถูกตีกลับให้แก้ไข
  permit_status text check (permit_status in ('preparing','submitted','under_review','needs_revision','approved','rejected')) default 'preparing'
)

-- บันทึกเวลาทำงาน (ข้อ 3.9) — รองรับทั้งกดจับเวลาสดและกรอกย้อนหลัง
time_entries (
  id uuid primary key,
  task_id uuid references tasks(id),
  user_id uuid references users(id),
  started_at timestamptz,
  ended_at timestamptz,
  duration_minutes integer,           -- คำนวณจาก started/ended หรือกรอกเองตอน manual entry
  note text,
  created_at timestamptz default now()
)

notifications (
  id uuid primary key,
  user_id uuid references users(id),
  task_id uuid references tasks(id),
  type text,             -- 'new_assignment','due_soon','overdue','new_comment'
  is_read boolean default false,
  created_at timestamptz default now()
)
```

**Row Level Security (RLS):** ต้องเปิดใช้ทุกตารางตั้งแต่ต้น มี 2 ชั้น:
1. **Org isolation (สำคัญที่สุด เพราะเป็น multi-tenant):** user เห็นข้อมูลเฉพาะ `org_id` ของตัวเองเท่านั้น ห้ามเห็นข้อมูลข้ามบริษัทเด็ดขาด — นี่คือ policy ที่พลาดไม่ได้เลยถ้าจะขายให้บริษัทอื่นในอนาคต
2. **Role scoping ภายใน org เดียวกัน:** member เห็นเฉพาะงานของทีมตนเอง, manager เห็นทั้งทีม, admin เห็นทั้งหมดใน org

(บทเรียนจากโปรเจกต์ ERP เดิม: อย่าปล่อยให้ AI สร้างระบบโดยไม่มี RLS แล้วค่อยแปะทีหลัง — ให้ระบุไว้ใน prompt แรกเลย และต้องทดสอบด้วยการ query จริงข้าม org ทดสอบ ไม่ใช่เชื่อ AI รายงานว่าผ่าน)

---

## 6. Information Architecture (Sitemap / Routes)

```
/login
/dashboard                 → หน้าแรกหลัง login (ข้อ 3.1)
/tasks                     → Task list view (filter/sort/search)
/tasks/[id]                → รายละเอียดงาน + comment + activity log + issue log (3.7) + time tracking (3.9)
/board                     → Kanban board (ข้อ 3.3)
/calendar                  → มุมมองปฏิทินตาม deadline (ข้อ 3.3)
/permits                   → มุมมองเฉพาะติดตามใบขออนุญาต (ข้อ 3.8)
/my-tasks                  → งานของฉัน (สำหรับ role member)
/reports                   → หน้ารายงาน + export (ข้อ 3.6)
/notifications             → รายการแจ้งเตือนทั้งหมด
/teams                     → จัดการทีม (admin เท่านั้น)
/settings                  → ตั้งค่าบัญชี/องค์กร
```

---

## 7. Tech Stack ที่แนะนำ

| ส่วน | เทคโนโลยี | เหตุผล |
|---|---|---|
| Frontend | Next.js (App Router) + TailwindCSS + shadcn/ui | เข้ากับ AI coding tools ได้ดีที่สุดในปัจจุบัน, เอกสาร/ตัวอย่างเยอะ |
| Backend | Next.js API Routes / Supabase Edge Functions | ไม่ต้องแยก backend server ต่างหาก |
| Database | PostgreSQL ผ่าน **Supabase project ใหม่แยกต่างหาก** (คนละ instance จาก Medethree ERP) | ทีมเดียวกันคุ้นเครื่องมืออยู่แล้ว แต่แยกข้อมูล/แยก billing เพราะเป็นคนละผลิตภัณฑ์ |
| Realtime | Supabase Realtime (สำหรับ Kanban board + notification ไม่ต้อง refresh) | จำเป็นสำหรับ "Operational Visibility" ที่เป็นหัวใจของระบบ |
| Auth | Supabase Auth | รองรับ role-based ผ่าน RLS ได้ตรง |
| File storage | Supabase Storage | สำหรับไฟล์แนบ |
| Notification | LINE Messaging API (LINE OA) + Supabase Edge Function เป็นตัวส่ง | ช่องทางแจ้งเตือนหลักตั้งแต่ Phase 1 ตามที่ตกลง |
| Deploy | Vercel (frontend) + Supabase (backend/DB) | ตั้งค่าเร็ว เข้ากับ Next.js โดยตรง |

### 7.1 การตัดสินใจเรื่อง Hosting & Domain (Phase 1 — ยืนยันแล้ว)

- **ใช้แผนฟรีของ Supabase + Vercel ก่อน** เพียงพอสำหรับทีมภายในขนาดเล็กในช่วง Phase 1-3 (ค่อยพิจารณาอัปเกรดเป็นแผนเสียเงินตอนใกล้ Phase 4 ที่จะเปิดให้บริษัทอื่นใช้งานจริง)
- **ยังไม่ซื้อโดเมนของตัวเอง** — ใช้ URL แบบ `*.vercel.app` ที่ Vercel ให้ฟรีไปก่อน แล้วค่อยผูกโดเมนจริงทีหลังได้โดยไม่กระทบโค้ดหรือฐานข้อมูลเลย (Vercel รองรับการเพิ่มโดเมนได้ทุกเมื่อ)
- **ไม่ใช้พื้นที่ Google One/Google Drive สำหรับระบบนี้** — Google One คือพื้นที่เก็บไฟล์ส่วนตัว (Drive/Gmail/Photos) ซึ่งเป็นคนละอย่างกับ "database" และ "hosting" ที่เว็บแอปต้องใช้รันระบบ ไม่สามารถนำ 5TB นั้นมาทดแทน Supabase/Vercel ได้ — แต่ไม่ต้องกังวล เพราะแผนฟรีของ Supabase (500MB database + 1GB file storage) เพียงพอสำหรับการใช้งานภายในทีมเล็กในช่วงเริ่มต้นอยู่แล้ว

---

## 8. Non-Functional Requirements

- **Responsive:** ต้องใช้งานได้ดีบนแท็บเล็ต/มือถือ ไม่ใช่แค่จอคอมพิวเตอร์ (ผู้ใช้งานภาคสนามอาจเปิดผ่าน iPad)
- **Real-time:** การเปลี่ยนสถานะงาน/คอมเมนต์ต้องอัปเดตแบบ real-time ไม่ต้อง refresh หน้า
- **Performance:** Dashboard ต้องโหลดภาพรวมได้ภายใน 2 วินาที แม้มีงานหลายร้อยรายการ
- **Security:** RLS ทุกตาราง, ห้าม client-side เห็นข้อมูลข้ามทีมโดยไม่ผ่าน permission check

---

## 9. แผนการพัฒนาแบบแบ่ง Phase (สำหรับป้อน AI ทีละขั้น)

**Phase 1 — Core (MVP):**
Auth + Roles (org-scoped RLS ตั้งแต่ต้น), Task CRUD, Kanban Board, Dashboard พื้นฐาน (นับจำนวนงานตามสถานะ), My Tasks, **ผูกบัญชี LINE + ส่งแจ้งเตือนพื้นฐานผ่าน LINE OA** (งานใหม่/ใกล้ครบกำหนด/เลยกำหนด), **Issue/Blocker Log (ข้อ 3.7) + Permit Tracking (ข้อ 3.8) — ต้องอยู่ใน Phase 1 เพราะเป็น pain point ที่ทีมออกแบบระบุว่าหงุดหงิดที่สุด และเป็นจุดที่ใช้เปิดตัวระบบ (pilot) กับทีมนี้ก่อน**

**Phase 2 — Collaboration:**
Comment & Activity Log, In-app Notification แบบเต็มรูปแบบ, Email notification (สำรอง), **มุมมองปฏิทิน (Calendar)**, **Time Tracking (ข้อ 3.9)**

**Phase 3 — Intelligence & Reporting:**
Reports + PDF/Excel export, "งานเสี่ยงล่าช้า/งานค้าง" logic อัตโนมัติ, Viewer role

**Phase 4 — SaaS Readiness (เมื่อพร้อมขายให้บริษัทอื่น):**
Self-signup สร้าง organization ใหม่ได้เอง, ระบบ subscription/billing, org-level settings (branding, การตั้งค่าแจ้งเตือนต่อ org), การทดสอบ RLS ข้าม org อย่างเข้มข้นก่อนเปิดให้ลูกค้าภายนอกใช้จริง

> แนะนำให้จบ Phase 1 จนใช้งานได้จริงและทดสอบแล้ว ก่อนขยับไป Phase ถัดไป — นี่คือปัจจัยที่ทำให้ AI coding tool สร้างงานสำเร็จสูงสุด มากกว่าการยัดทุกอย่างในคำสั่งเดียว โดยเฉพาะ Phase 4 ไม่ควรเริ่มจนกว่า Phase 1-3 จะใช้งานจริงในทีมภายในได้อย่างมั่นคงแล้ว

---

## 10. ข้อความ Prompt ตัวอย่างสำหรับเริ่มกับ AI Coding Tool

```
สร้างเวปแอป Next.js (App Router) + TailwindCSS + shadcn/ui
เชื่อมต่อ Supabase (Auth, Database, Realtime, Storage)

ให้สร้าง Phase 1 ตามสเปคนี้เท่านั้น:
[แนบเนื้อหาข้อ 2, 3.1-3.3, 4, 5, 6 (เฉพาะ route ที่เกี่ยวกับ Phase 1), 7]

ข้อกำหนดบังคับ:
- เปิด Row Level Security ทุกตารางตั้งแต่ migration แรก รวม org-level isolation (ตาราง organizations เป็นชั้นบนสุด แม้ตอนนี้จะมี org เดียวก็ตาม)
- ทุก state transition ของ task ต้องบันทึกลง activity_log อัตโนมัติ
- ห้ามข้าม role check ฝั่ง client — ต้อง enforce ที่ RLS/server ด้วย
- ต้องมีระบบผูกบัญชี LINE (line_user_id) และส่ง push notification ผ่าน LINE Messaging API ตั้งแต่ Phase 1

ข้อกำหนดป้องกันการหลอน/รายงานเท็จ (ดูรายละเอียดเต็มในข้อ 10.1 — แนบทุกครั้งทุก Phase):
1. ห้ามรายงานว่า "เสร็จแล้ว / 100% / PASS" โดยไม่แนบหลักฐานที่ตรวจสอบได้จริง (ผลรัน query จริง, log การทดสอบจริง, screenshot) — ไม่มีหลักฐาน = ถือว่ายังไม่เสร็จ
2. ห้ามเพิ่มฟีเจอร์/ตาราง/logic ใดๆ ที่ไม่ได้ระบุไว้ในสเปค Phase นี้ แม้จะคิดว่ามีประโยชน์ — ถ้าอยากเพิ่ม ให้ถามก่อนเขียนโค้ดเสมอ ห้ามเขียนแล้วแจ้งทีหลัง
3. ก่อนแก้ schema/migration/config ต้องอ่านโครงสร้างที่มีอยู่จริงในโปรเจกต์ก่อนทุกครั้ง ห้ามเขียนจากการสันนิษฐานหรือจำจากบทสนทนาก่อนหน้าเพียงอย่างเดียว
4. ถ้าข้อมูลไม่พอหรือไม่แน่ใจ ให้บอกตรงๆ ว่า "ไม่แน่ใจ/ต้องตรวจสอบเพิ่ม" ห้ามตอบแบบมั่นใจทั้งที่ไม่มีมูล
5. ทุกครั้งที่อ้างว่าแก้ปัญหาเสร็จแล้ว ต้องแนบวิธีที่ผู้ใช้ตรวจสอบได้ด้วยตัวเอง (เช่น คำสั่ง SQL ที่รันดูผลได้ตรงๆ)
```

### 10.1 ข้อกำหนดป้องกันการหลอน/รายงานเท็จ (Anti-Hallucination Guardrails) — บังคับใช้ทุก Phase

**ที่มา:** ระหว่างทำโปรเจกต์ Medethree ERP ก่อนหน้านี้ พบปัญหาซ้ำหลายครั้งจาก Antigravity ที่ต้องป้องกันไม่ให้เกิดซ้ำกับโปรเจกต์นี้:
- รายงานว่า "ผ่าน 100% / PASS" ทั้งที่ตรวจสอบจริงแล้วไม่ผ่าน (ต้องยืนยันด้วยการ query จริงบน production เองถึงเจอว่าไม่จริง)
- เพิ่มฟีเจอร์ที่ไม่มีใครขอ (3-Level Cost Breakdown + Cash Flow forecasting) เข้ามาในโค้ดโดยไม่แจ้งล่วงหน้า
- เสนอไฟล์/สคริปต์ที่ไม่ตรงกับโครงสร้างตารางจริงที่มีอยู่ (เขียนจากการสันนิษฐานแทนที่จะเช็คของจริงก่อน)
- อ้างว่า deploy ระบบสำคัญไปแล้ว (sync write-path) ทั้งที่ยังไม่ได้ deploy จริงบน production

**กติกาที่ต้องยึดตลอดทั้งโปรเจกต์ (ไม่ใช่แค่ตอนเริ่ม):**
1. ทุกคำกล่าวอ้างว่า "เสร็จ/ผ่าน/deploy แล้ว" ต้องมีหลักฐานตรวจสอบได้แนบมาด้วยเสมอ — ไม่มีหลักฐาน = ยังไม่นับว่าเสร็จ
2. ห้ามขยายขอบเขตงานเกินสเปคของ Phase ที่กำลังทำโดยไม่ขออนุมัติก่อน
3. ต้องอ่านสถานะจริงของโค้ด/schema ก่อนแก้ไขทุกครั้ง ห้ามเขียนจากความจำ/การเดา
4. ยอมรับความไม่แน่ใจได้ ดีกว่าตอบมั่นใจผิดๆ
5. งานทุกอย่างที่อ้างว่าเสร็จ ต้องแนบขั้นตอนให้ผู้ใช้ (คุณ) ตรวจสอบเองได้อย่างอิสระ ไม่ใช่ให้เชื่อคำรายงานเฉยๆ — และให้ถือเป็นหลักปฏิบัติมาตรฐานว่า **ทุกครั้งที่ AI รายงานว่าเสร็จ ต้องมีการตรวจสอบอิสระก่อนปิดงานจริงเสมอ ไม่ว่า AI ตัวไหนจะรายงานก็ตาม**

---

## 11. หลักการออกแบบเพื่อการยอมรับของผู้ใช้งาน (Adoption Strategy)

**บริบท:** ผู้ใช้งานส่วนใหญ่ไม่ชอบเปลี่ยนวิธีทำงาน กลัวเทคโนโลยี และมีอคติกับวิธีใหม่ๆ — นี่คือปัจจัยที่งานวิจัยด้าน construction tech adoption ชี้ตรงกันว่าเป็นสาเหตุอันดับต้นที่ทำให้ระบบใหม่ถูกทิ้งไม่ใช้ ไม่ใช่เพราะระบบไม่ดี แต่เพราะกระบวนการนำไปใช้ผิด ข้อกำหนดด้านล่างนี้จึงสำคัญพอๆ กับ requirement ทางเทคนิค และควรระบุให้ AI coding tool รับทราบไว้ตั้งแต่ต้น เพราะกระทบการออกแบบ UI โดยตรง:

- **ใช้คำที่ผู้ใช้คุ้นเคยอยู่แล้ว** ("ติดปัญหา", "ใบขออนุญาต", "แก้ไขแล้ว") ห้ามใช้ศัพท์เทคนิค ("ticket", "blocker", "SLA") แม้แต่ในเอกสารระบบ
- **ลดการพิมพ์ให้มากที่สุด** ใช้ dropdown/ปุ่มเลือกแทนช่องกรอกข้อความอิสระทุกจุดที่ทำได้ (เช่น หมวดปัญหาที่พบบ่อย) เหลือช่องพิมพ์อิสระไว้เฉพาะรายละเอียดที่จำเป็นจริงๆ
- **แจ้งเตือนต้อง "ดันข้อมูลหาคน" ไม่ใช่ "รอให้คนมาเปิดแอป"** — นี่คือเหตุผลที่ LINE OA ต้องมีตั้งแต่ Phase 1 (ข้อ 3.4) เพราะลดพฤติกรรมที่ต้องเปลี่ยนให้เหลือน้อยที่สุด (ไม่ต้องจำไปเปิดแอปเอง)
- **ห้ามให้ระบบให้ความรู้สึกเป็นเครื่องมือจับผิด/ตรวจสอบผลงาน** แม้ตัวข้อมูล (ใครทำอะไร ใครแก้ปัญหา) จะดูเหมือนสอดส่องได้ — ควรวางกรอบตอนเปิดตัวระบบว่า "ไม่ต้องมานั่งจำ ไม่ต้องอธิบายซ้ำให้หัวหน้าฟังทุกวัน" เน้นว่าช่วยลดภาระผู้ใช้เอง ไม่ใช่เพื่อจับตาดูผู้ใช้
- **เริ่มจากจุดที่เจ็บที่สุดของผู้ใช้จริง** — เปิดตัวด้วยฟีเจอร์ Permit Tracking + Issue Log (ข้อ 3.7-3.8) ให้ทีมออกแบบก่อน เพราะเป็น pain point ที่เขาระบุเองว่าหงุดหงิดที่สุด จะได้ผลตอบรับเชิงบวกเร็วที่สุด ก่อนค่อยขยายไปฟีเจอร์อื่น/แผนกอื่น
- **หาคนใน "ตัวช่วย" ในทีม** เลือกคน 1-2 คนที่เปิดรับเทคโนโลยีมากกว่าเพื่อน ให้เป็นคนช่วยเพื่อนร่วมทีมใช้งานแบบไม่เป็นทางการ งานวิจัยชี้ว่าการชวนโดยเพื่อนร่วมงานได้ผลกว่าการสั่งจากผู้บริหารเสมอ

## 12. ข้อควรรู้อย่างตรงไปตรงมา (ก่อนนำไปใช้จริง)

เอกสารนี้ถูกออกแบบให้ครบทั้ง 4 องค์ประกอบที่ AI coding tool ต้องการ (data model, workflow, IA, phasing) ซึ่งเพิ่มโอกาสสำเร็จได้สูงมากเมื่อเทียบกับการบอกแค่ "อยากได้ระบบจัดการงาน" — **แต่ไม่มีเอกสารสเปคใดที่รับประกันผลลัพธ์ "สมบูรณ์แบบ 100% ในการรันครั้งเดียว" ได้** ไม่ว่าจะป้อนให้ AI ตัวไหนก็ตาม เพราะ:
- AI coding tool แต่ละตัว (Claude Code, Antigravity, Codex) มีจุดแข็ง/ข้อจำกัดต่างกัน โดยเฉพาะเรื่อง realtime subscription และ RLS policy ที่ซับซ้อน มักต้อง debug รอบสอง
- ควรทดสอบ RLS policy ด้วยการ query จริง ไม่เชื่อแค่ AI รายงานว่า "ผ่านแล้ว" (บทเรียนตรงนี้ตรงกับที่พบในโปรเจกต์ Medethree ERP ของคุณเองที่ผ่านมา)

สิ่งที่เอกสารนี้ **ยืนยันได้จริง**: มันให้บริบทครบพอที่ AI เหล่านี้จะเข้าใจภาพรวมระบบ, โครงสร้างข้อมูล, และลำดับการพัฒนาได้ถูกต้อง ลดการตีความผิดหรือถามกลับไปกลับมา — ซึ่งคือสิ่งที่ทำให้ผลลัพธ์ "ใช้งานได้จริง" สูงขึ้นมากเมื่อเทียบกับสรุปสั้นๆ จากภาพต้นฉบับ
