# TaskFlow Manager — Phase 1 (Core MVP)

ระบบติดตามงานและการทำงานร่วมกันสำหรับองค์กร (Operational Visibility)
สร้างขึ้นตามเอกสารข้อกำหนดทางเทคนิค [TaskFlow-Manager-Spec.md](./Work%20Flow%20Concept/TaskFlow-Manager-Spec.md)

---

## 🚀 ฟีเจอร์ที่สร้างใน Phase 1 (Core MVP)

1. **User Roles & RBAC (ข้อ 2 & 4):**
   - การแบ่งบทบาทชัดเจน: Admin, Manager/Supervisor, Team Member, Viewer
   - ตรวจสอบสิทธิ์ที่ Server และ Row Level Security (RLS)
2. **Dashboard แบบ Real-time (ข้อ 3.1):**
   - KPI สรุปสถานะงาน (To Do, In Progress, Review, Completed, Overdue)
   - **Widget พิเศษ: "งานที่ติดปัญหาอยู่" (Unresolved Issues)** (ข้อ 3.7)
   - Widget "งานเสี่ยงล่าช้า / ใกล้ครบกำหนด" (≤ 3 วัน)
   - Widget "งานค้าง / ไม่มีความเคลื่อนไหว" (> 2 วัน)
   - กราฟแท่งกระจายภาระงานในทีม (Workload Distribution)
3. **Task Management & Views (ข้อ 3.2 - 3.3):**
   - **Kanban Board (`/board`):** Drag & Drop ย้ายสถานะงาน พร้อมตรวจสอบกฎ Workflow อัตโนมัติ
   - **Task List View (`/tasks`):** มุมมองแบบตารางกระชับ กรอง/ค้นหา/เรียงลำดับได้รวดเร็ว
   - **My Tasks (`/my-tasks`):** รวมเฉพาะงานที่ผู้ใช้คนนั้นรับผิดชอบ
4. **Issue / Blocker Log (ข้อ 3.7):**
   - บันทึกปัญหาที่พบ ("ติดปัญหาอะไร → แก้ไขแล้วหรือยัง → ใครแก้ → แก้อย่างไร")
   - ลดภาระการถามซ้ำด้วยวาจา
5. **Permit Tracking Module (ข้อ 3.8):**
   - ติดตามวงจรชีวิตใบขออนุญาตก่อสร้างภายนอก: `เตรียมเอกสาร` → `ยื่นขอแล้ว` → `รอพิจารณา` → `ติดปัญหา/รอแก้ไข` → `อนุมัติแล้ว` / `ถูกปฏิเสธ`
   - ตัวนับรอบการตีกลับแก้ไข (`revision_round`) อัตโนมัติเมื่อสถานะเปลี่ยนเป็นรอแก้ไข
6. **Workflow State Machine & Tamper-Proof Activity Log (ข้อ 4, 3.5):**
   - ตรวจจับและบันทึกทุกการเปลี่ยนสถานะ, แก้ไข deadline, ปรับ priority ลง `activity_log` อัตโนมัติ (ห้ามลบ/แก้ไข)
7. **LINE Messaging API Push Notification (ข้อ 3.4):**
   - ระบบ Notification Adapter (`InAppNotificationProvider`, `LineNotificationProvider`)
   - ผูกบัญชีผ่าน `line_user_id` และส่ง Flex Message แจ้งเตือนงานด่วน

---

## 🛠️ โครงสร้างฐานข้อมูลและการรัน Migration บน Supabase

ไฟล์ SQL Migration อยู่ในโฟลเดอร์ `supabase/migrations/`:
- `001_initial_schema.sql`: โครงสร้าง 13 ตาราง, RLS Policies ทุกตาราง, และ Triggers อัตโนมัติ
- `002_seed_test_data.sql`: ข้อมูลจำลองสำหรับทดสอบ Multi-Tenant (Org 1: MeDTree, Org 2: Competitor)
- `supabase/tests/rls_isolation_test.sql`: Script ทดสอบ RLS Isolation ข้ามองค์กรและ Triggers

### ขั้นตอนการรันบน Supabase:
1. เปิด Supabase Dashboard ของโปรเจกต์ TaskFlow Manager
2. ไปที่เมนู **SQL Editor**
3. คัดลอกเนื้อหาใน `supabase/migrations/001_initial_schema.sql` แล้วกด **Run**
4. คัดลอกเนื้อหาใน `supabase/migrations/002_seed_test_data.sql` แล้วกด **Run**
5. (ทดสอบความถูกต้อง) คัดลอก `supabase/tests/rls_isolation_test.sql` แล้วกด **Run** เพื่อดูผลลัพธ์ Pass ทั้งหมด

---

## 💻 วิธีการรันโปรเจกต์ (Local Development)

```bash
# 1. ติดตั้ง Dependencies (ทำครั้งแรก)
npm install

# 2. เริ่มต้นรัน Dev Server
npm run dev

# 3. ตรวจสอบ Typecheck
npm run typecheck

# 4. ทดสอบ Production Build
npm run build
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## 🔒 หลักฐานการทดสอบตามข้อ 10.1 (Anti-Hallucination Guardrails)

- **Next.js Production Build:** `npm run build` ผ่าน 100% ครบทุก Route
- **TypeScript Typecheck:** `tsc --noEmit` ผ่าน 0 errors
- **Workflow State Machine:** กฎการเปลี่ยนสถานะถูกบังคับใช้ทั้งฝั่ง Client UI และ API `/api/tasks/[id]/transition`
