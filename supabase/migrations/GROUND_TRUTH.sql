-- ====================================================================
-- GROUND_TRUTH.sql — Authoritative Live Supabase Schema & Security Setup
-- Synchronized with live database state (WO-LTF-W2 / E8)
-- ====================================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Teams
CREATE TABLE IF NOT EXISTS public.teams (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Users (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    org_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
    line_user_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member', 'viewer')) DEFAULT 'member',
    team_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    team_id TEXT REFERENCES public.teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('design', 'permit', 'site', 'other')) DEFAULT 'design',
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('todo', 'assigned', 'in_progress', 'review', 'completed')) DEFAULT 'todo',
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    deadline TIMESTAMPTZ,
    status_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Task Assignees
CREATE TABLE IF NOT EXISTS public.task_assignees (
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, user_id)
);

-- 7. Comments
CREATE TABLE IF NOT EXISTS public.comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Attachments
CREATE TABLE IF NOT EXISTS public.attachments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    uploaded_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Activity Log (Tamper-Proof Audit History)
CREATE TABLE IF NOT EXISTS public.activity_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Task Issues / Blockers
CREATE TABLE IF NOT EXISTS public.task_issues (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    raised_by TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    raised_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_description TEXT
);

-- 11. Permit Details
CREATE TABLE IF NOT EXISTS public.permit_details (
    task_id TEXT PRIMARY KEY REFERENCES public.tasks(id) ON DELETE CASCADE,
    permit_type TEXT NOT NULL DEFAULT 'ใบอนุญาตก่อสร้าง',
    authority TEXT NOT NULL DEFAULT 'เทศบาล/อบต.',
    submitted_date DATE,
    target_approval_date DATE,
    revision_round INTEGER NOT NULL DEFAULT 0,
    permit_status TEXT NOT NULL CHECK (permit_status IN ('preparing', 'submitted', 'under_review', 'needs_revision', 'approved', 'rejected')) DEFAULT 'preparing'
);

-- 12. Time Entries
CREATE TABLE IF NOT EXISTS public.time_entries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    minutes INTEGER NOT NULL CHECK (minutes > 0),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- Helper Functions & Trigger Definitions
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'org_id'),
    (SELECT org_id FROM public.users WHERE id = auth.uid()::text)
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, org_id, email, full_name, role)
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'org_id', '11111111-1111-1111-1111-111111111111'),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.email, '')),
    'member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- --------------------------------------------------------------------
-- Enable Row Level Security (RLS)
-- --------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- Tenant Isolation Policies
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "tasks_org_isolation_all" ON public.tasks;
CREATE POLICY "tasks_org_isolation_all" ON public.tasks
  FOR ALL
  USING (org_id = public.current_user_org_id())
  WITH CHECK (org_id = public.current_user_org_id());

DROP POLICY IF EXISTS "users_org_isolation_select" ON public.users;
CREATE POLICY "users_org_isolation_select" ON public.users
  FOR SELECT
  USING (org_id = public.current_user_org_id());

DROP POLICY IF EXISTS "projects_org_isolation_all" ON public.projects;
CREATE POLICY "projects_org_isolation_all" ON public.projects
  FOR ALL
  USING (org_id = public.current_user_org_id())
  WITH CHECK (org_id = public.current_user_org_id());

DROP POLICY IF EXISTS "teams_org_isolation_all" ON public.teams;
CREATE POLICY "teams_org_isolation_all" ON public.teams
  FOR ALL
  USING (org_id = public.current_user_org_id())
  WITH CHECK (org_id = public.current_user_org_id());

DROP POLICY IF EXISTS "comments_org_select" ON public.comments;
CREATE POLICY "comments_org_select" ON public.comments FOR SELECT
  USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_user_org_id()));

DROP POLICY IF EXISTS "attachments_org_select" ON public.attachments;
CREATE POLICY "attachments_org_select" ON public.attachments FOR SELECT
  USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_user_org_id()));

DROP POLICY IF EXISTS "activity_log_org_select" ON public.activity_log;
CREATE POLICY "activity_log_org_select" ON public.activity_log FOR SELECT
  USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_user_org_id()));

DROP POLICY IF EXISTS "task_issues_org_all" ON public.task_issues;
CREATE POLICY "task_issues_org_all" ON public.task_issues FOR ALL
  USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_user_org_id()))
  WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_user_org_id()));

DROP POLICY IF EXISTS "permit_details_org_all" ON public.permit_details;
CREATE POLICY "permit_details_org_all" ON public.permit_details FOR ALL
  USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_user_org_id()))
  WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_user_org_id()));

DROP POLICY IF EXISTS "time_entries_org_all" ON public.time_entries;
CREATE POLICY "time_entries_org_all" ON public.time_entries FOR ALL
  USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_user_org_id()));

DROP POLICY IF EXISTS "notifications_user_select" ON public.notifications;
CREATE POLICY "notifications_user_select" ON public.notifications FOR SELECT
  USING (user_id = auth.uid()::text);
