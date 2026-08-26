-- ====================================================================
-- Lighthouse TaskFlow v2.1 — Multi-Tenant Row Level Security (RLS) Migration
-- File: supabase/migrations/20260827000001_enable_rls.sql
-- ====================================================================

-- 1. Enable Row-Level Security on All 8 Domain Tables
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;

-- 2. Multi-Tenant Organization Isolation Policies (org_id Scoping)

-- Tasks Isolation Policy
DROP POLICY IF EXISTS tenant_isolation ON tasks;
CREATE POLICY tenant_isolation ON tasks
  FOR ALL
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- Projects Isolation Policy
DROP POLICY IF EXISTS tenant_isolation ON projects;
CREATE POLICY tenant_isolation ON projects
  FOR ALL
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- Issues Isolation Policy
DROP POLICY IF EXISTS tenant_isolation ON issues;
CREATE POLICY tenant_isolation ON issues
  FOR ALL
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- Comments Isolation Policy
DROP POLICY IF EXISTS tenant_isolation ON comments;
CREATE POLICY tenant_isolation ON comments
  FOR ALL
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- Attachments Isolation Policy
DROP POLICY IF EXISTS tenant_isolation ON attachments;
CREATE POLICY tenant_isolation ON attachments
  FOR ALL
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- Time Entries Isolation Policy
DROP POLICY IF EXISTS tenant_isolation ON time_entries;
CREATE POLICY tenant_isolation ON time_entries
  FOR ALL
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- Notifications Isolation Policy (User-level & Org-level)
DROP POLICY IF EXISTS user_notifications ON notifications;
CREATE POLICY user_notifications ON notifications
  FOR ALL
  USING (user_id = auth.uid() OR org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (user_id = auth.uid() OR org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- Profiles Isolation Policy (Self Read/Write & Org Read)
DROP POLICY IF EXISTS profile_access ON profiles;
CREATE POLICY profile_access ON profiles
  FOR ALL
  USING (id = auth.uid() OR org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Teams Isolation Policy
DROP POLICY IF EXISTS tenant_isolation ON teams;
CREATE POLICY tenant_isolation ON teams
  FOR ALL
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);

-- End of RLS Migration
