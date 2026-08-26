-- ====================================================================
-- TaskFlow Manager — Phase 1 Initial Schema & RLS Policies
-- Multi-Tenant Org-Level Isolation + Strict Workflow & Activity Log
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. Organizations (Top-level Multi-Tenant Boundary)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 2. Teams
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 3. Users (Linked to Supabase Auth)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    line_user_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member', 'viewer')) DEFAULT 'member',
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 4. Projects
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 5. Tasks
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('design', 'permit', 'site', 'other')) DEFAULT 'design',
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('todo', 'assigned', 'in_progress', 'review', 'completed')) DEFAULT 'todo',
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 6. Task Assignees (Many-to-Many)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_assignees (
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, user_id)
);

-- --------------------------------------------------------------------
-- 7. Comments
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 8. Attachments
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 9. Activity Log (Tamper-Proof History)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 10. Task Issues / Blocker Log (Section 3.7)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    issue_description TEXT NOT NULL,
    raised_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    raised_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_description TEXT
);

-- --------------------------------------------------------------------
-- 11. Permit Details (Section 3.8)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permit_details (
    task_id UUID PRIMARY KEY REFERENCES public.tasks(id) ON DELETE CASCADE,
    permit_type TEXT NOT NULL DEFAULT 'ใบอนุญาตก่อสร้าง',
    authority TEXT NOT NULL DEFAULT 'เทศบาล/อบต.',
    submitted_date DATE,
    target_approval_date DATE,
    revision_round INTEGER NOT NULL DEFAULT 0,
    permit_status TEXT NOT NULL CHECK (permit_status IN ('preparing', 'submitted', 'under_review', 'needs_revision', 'approved', 'rejected')) DEFAULT 'preparing'
);

-- --------------------------------------------------------------------
-- 12. Time Entries (Section 3.9 - Schema foundation)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 13. Notifications (Section 3.4)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new_assignment', 'due_soon', 'overdue', 'new_comment', 'status_changed', 'issue_logged')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- TRIGGERS & STORED PROCEDURES
-- ====================================================================

-- Function: Automatic Task Activity Logger & Updated At
CREATE OR REPLACE FUNCTION public.handle_task_update_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();

    -- Status change log
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.activity_log (task_id, user_id, action, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status, NEW.status);
    END IF;

    -- Deadline change log
    IF OLD.deadline IS DISTINCT FROM NEW.deadline THEN
        INSERT INTO public.activity_log (task_id, user_id, action, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'deadline_changed', OLD.deadline::TEXT, NEW.deadline::TEXT);
    END IF;

    -- Priority change log
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        INSERT INTO public.activity_log (task_id, user_id, action, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'priority_changed', OLD.priority, NEW.priority);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_task_activity_log ON public.tasks;
CREATE TRIGGER trg_task_activity_log
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_task_update_activity();


-- Function: Permit Auto Revision Round Increment
CREATE OR REPLACE FUNCTION public.handle_permit_status_update()
RETURNS TRIGGER AS $$
BEGIN
    -- If status moves to 'needs_revision' from any other status, increment revision_round
    IF NEW.permit_status = 'needs_revision' AND (OLD.permit_status IS DISTINCT FROM 'needs_revision') THEN
        NEW.revision_round = COALESCE(OLD.revision_round, 0) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_permit_revision_round ON public.permit_details;
CREATE TRIGGER trg_permit_revision_round
BEFORE UPDATE ON public.permit_details
FOR EACH ROW
EXECUTE FUNCTION public.handle_permit_status_update();


-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Helper Functions
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID AS $$
    SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_team_id()
RETURNS UUID AS $$
    SELECT team_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Organizations RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
TO authenticated
USING (id = public.current_org_id());

CREATE POLICY "Admins can update their organization"
ON public.organizations FOR UPDATE
TO authenticated
USING (id = public.current_org_id() AND public.current_user_role() = 'admin')
WITH CHECK (id = public.current_org_id() AND public.current_user_role() = 'admin');

-- 2. Teams RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view teams in their organization"
ON public.teams FOR SELECT
TO authenticated
USING (org_id = public.current_org_id());

CREATE POLICY "Admins can manage teams"
ON public.teams FOR ALL
TO authenticated
USING (org_id = public.current_org_id() AND public.current_user_role() = 'admin')
WITH CHECK (org_id = public.current_org_id() AND public.current_user_role() = 'admin');

-- 3. Users RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view colleagues in their organization"
ON public.users FOR SELECT
TO authenticated
USING (org_id = public.current_org_id());

CREATE POLICY "Users can update their own profile or Admin can update all"
ON public.users FOR UPDATE
TO authenticated
USING (org_id = public.current_org_id() AND (id = auth.uid() OR public.current_user_role() = 'admin'))
WITH CHECK (org_id = public.current_org_id() AND (id = auth.uid() OR public.current_user_role() = 'admin'));

CREATE POLICY "Admins and Managers can create users or self signup"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (
    (id = auth.uid()) OR 
    (org_id = public.current_org_id() AND public.current_user_role() IN ('admin', 'manager'))
);

-- 4. Projects RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects in their organization"
ON public.projects FOR SELECT
TO authenticated
USING (org_id = public.current_org_id());

CREATE POLICY "Admins and Managers can manage projects"
ON public.projects FOR ALL
TO authenticated
USING (org_id = public.current_org_id() AND public.current_user_role() IN ('admin', 'manager'))
WITH CHECK (org_id = public.current_org_id() AND public.current_user_role() IN ('admin', 'manager'));

-- 5. Tasks RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view tasks in their org"
ON public.tasks FOR SELECT
TO authenticated
USING (
    org_id = public.current_org_id() AND (
        public.current_user_role() IN ('admin', 'manager', 'viewer')
        OR created_by = auth.uid()
        OR id IN (SELECT task_id FROM public.task_assignees WHERE user_id = auth.uid())
        OR project_id IN (SELECT id FROM public.projects WHERE team_id = public.current_user_team_id())
    )
);

CREATE POLICY "Admins, Managers and Members can create tasks in their org"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (org_id = public.current_org_id() AND public.current_user_role() IN ('admin', 'manager', 'member'));

CREATE POLICY "Task updates allowed for assigned members or management"
ON public.tasks FOR UPDATE
TO authenticated
USING (
    org_id = public.current_org_id() AND (
        public.current_user_role() IN ('admin', 'manager')
        OR created_by = auth.uid()
        OR id IN (SELECT task_id FROM public.task_assignees WHERE user_id = auth.uid())
    )
)
WITH CHECK (org_id = public.current_org_id());

CREATE POLICY "Admins can delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (org_id = public.current_org_id() AND public.current_user_role() = 'admin');

-- 6. Task Assignees RLS
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task assignees visible to org members"
ON public.task_assignees FOR SELECT
TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

CREATE POLICY "Admins and Managers can manage assignees"
ON public.task_assignees FOR ALL
TO authenticated
USING (
    task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id())
    AND public.current_user_role() IN ('admin', 'manager')
)
WITH CHECK (
    task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id())
    AND public.current_user_role() IN ('admin', 'manager')
);

-- 7. Comments RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by task viewers"
ON public.comments FOR SELECT
TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

CREATE POLICY "Authenticated users can comment on org tasks"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (
    task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id())
    AND user_id = auth.uid()
);

CREATE POLICY "Users can update or delete own comments"
ON public.comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.current_user_role() = 'admin')
WITH CHECK (user_id = auth.uid() OR public.current_user_role() = 'admin');

-- 8. Attachments RLS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attachments viewable by org members"
ON public.attachments FOR SELECT
TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

CREATE POLICY "Users can upload attachments to org tasks"
ON public.attachments FOR INSERT
TO authenticated
WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

CREATE POLICY "Users can delete own attachments or admin"
ON public.attachments FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid() OR public.current_user_role() = 'admin');

-- 9. Activity Log RLS (Strictly Immutable History)
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity log viewable by org members"
ON public.activity_log FOR SELECT
TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

CREATE POLICY "Activity log insertable by system triggers and authenticated actions"
ON public.activity_log FOR INSERT
TO authenticated
WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

-- NOTE: No UPDATE or DELETE policies on activity_log to guarantee immutability

-- 10. Task Issues RLS (Section 3.7)
ALTER TABLE public.task_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task issues viewable by org members"
ON public.task_issues FOR SELECT
TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

CREATE POLICY "Org members can raise task issues"
ON public.task_issues FOR INSERT
TO authenticated
WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

CREATE POLICY "Org members can update or resolve task issues"
ON public.task_issues FOR UPDATE
TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()))
WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

-- 11. Permit Details RLS (Section 3.8)
ALTER TABLE public.permit_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permit details viewable by org members"
ON public.permit_details FOR SELECT
TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

CREATE POLICY "Permit details insertable by org members"
ON public.permit_details FOR INSERT
TO authenticated
WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

CREATE POLICY "Permit details updatable by org members"
ON public.permit_details FOR UPDATE
TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()))
WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

-- 12. Time Entries RLS (Section 3.9)
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Time entries viewable by org members"
ON public.time_entries FOR SELECT
TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id()));

CREATE POLICY "Users can insert their own time entries"
ON public.time_entries FOR INSERT
TO authenticated
WITH CHECK (
    task_id IN (SELECT id FROM public.tasks WHERE org_id = public.current_org_id())
    AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own time entries or Admin"
ON public.time_entries FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.current_user_role() = 'admin')
WITH CHECK (user_id = auth.uid() OR public.current_user_role() = 'admin');

-- 13. Notifications RLS (Section 3.4)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view only their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications as read"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable Realtime for core tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.permit_details;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
