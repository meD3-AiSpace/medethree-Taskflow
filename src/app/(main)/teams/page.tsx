"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { UserProfile, UserRole } from "@/lib/types/database.types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Mail,
  Smartphone,
  Pencil,
  Trash2,
  CheckCircle2,
  UserCheck,
  Building,
  UserPlus,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

export default function TeamsPage() {
  const router = useRouter();
  const {
    teams,
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    addTeam,
    updateTeam,
    resetDefaultTeams,
  } = useTaskStore();
  const { t, lang } = useLanguage();

  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeUsers = Array.isArray(users) ? users : [];

  // Search & Filter
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");

  // User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [teamId, setTeamId] = useState(safeTeams[0]?.id || "");
  const [lineUserId, setLineUserId] = useState("");
  const [showLineHelp, setShowLineHelp] = useState(false);

  // Team Modal State
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamNameEn, setTeamNameEn] = useState("");
  const [teamDescription, setTeamDescription] = useState("");

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Open Create User Modal
  const handleOpenCreateUser = (defaultTeamId?: string) => {
    setEditingUserId(null);
    setFullName("");
    setEmail(`user${Date.now().toString().slice(-4)}@baansuay.com`);
    setPhoneNumber("");
    setRole("member");
    setTeamId(defaultTeamId || safeTeams[0]?.id || "");
    setLineUserId("");
    setShowLineHelp(false);
    setShowUserModal(true);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user: UserProfile) => {
    if (!user) return;
    setEditingUserId(user.id);
    setFullName(user.full_name || "");
    setEmail(user.email || "");
    setPhoneNumber(user.phone_number || "");
    setRole(user.role || "member");
    setTeamId(user.team_id || safeTeams[0]?.id || "");
    setLineUserId(user.line_user_id || "");
    setShowLineHelp(false);
    setShowUserModal(true);
  };

  // Save User (Create / Update)
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    if (editingUserId) {
      updateUser(editingUserId, {
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim() || null,
        role,
        team_id: teamId || safeTeams[0]?.id,
        line_user_id: lineUserId.trim() || null,
      });
      showNotification(lang === "th" ? `อัปเดตข้อมูลคุณ "${fullName}" เรียบร้อยแล้ว` : `Updated ${fullName} successfully`);
    } else {
      addUser({
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim() || undefined,
        role,
        team_id: teamId || safeTeams[0]?.id,
        line_user_id: lineUserId.trim() || undefined,
      });
      showNotification(lang === "th" ? `เพิ่มสมาชิก "${fullName}" และกำหนดสิทธิ์ ${role.toUpperCase()} เรียบร้อยแล้ว` : `Added ${fullName} with ${role.toUpperCase()} role`);
    }

    setShowUserModal(false);
  };

  // Delete User
  const handleDeleteUser = (user: UserProfile) => {
    if (!user) return;
    const confirmName = user.full_name || "สมาชิกท่านนี้";
    if (confirm(lang === "th" ? `ยืนยันที่จะลบสมาชิก "${confirmName}" หรือไม่?` : `Are you sure you want to delete ${confirmName}?`)) {
      const res = deleteUser(user.id);
      if (res?.success) {
        showNotification(lang === "th" ? `ลบผู้ใช้ "${confirmName}" เรียบร้อยแล้ว` : `Deleted ${confirmName}`);
      } else if (res?.message) {
        alert(res.message);
      }
    }
  };

  // Save Team (Create / Update)
  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    if (editingTeamId) {
      updateTeam(editingTeamId, teamName.trim(), teamNameEn.trim(), teamDescription.trim());
      showNotification(lang === "th" ? `แก้ไขชื่อฝ่าย "${teamName}" เรียบร้อย` : `Updated department`);
    } else {
      addTeam(teamName.trim(), teamNameEn.trim(), teamDescription.trim());
      showNotification(lang === "th" ? `สร้างฝ่ายใหม่ "${teamName}" เรียบร้อย` : `Created department`);
    }
    setTeamName("");
    setTeamNameEn("");
    setTeamDescription("");
    setEditingTeamId(null);
    setShowTeamModal(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {lang === "th"
                ? "จัดการทีมและฝ่ายงานโครงการบ้านจัดสรร (Teams & Departments)"
                : "Housing Estate Departments & Teams Management"}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === "th"
              ? `โครงสร้างฝ่ายงานทั้งหมด ${safeTeams.length} ฝ่าย ครอบคลุมทั้งสายรับเหมาก่อสร้างและสายพัฒนาโครงการบ้านจัดสรร`
              : `Organizational structure of ${safeTeams.length} departments covering residential housing development and site construction`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (confirm(lang === "th" ? "ต้องการรีเซ็ตโครงสร้างทีมเป็น 12 ฝ่ายมาตรฐานงานก่อสร้างและบ้านจัดสรรหรือไม่?" : "Reset to 12 standard housing & construction departments?")) {
                resetDefaultTeams();
                showNotification(lang === "th" ? "รีเซ็ตโครงสร้าง 12 ฝ่ายงานมาตรฐานเรียบร้อย" : "Reset standard departments");
              }
            }}
            className="text-xs h-9 gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{lang === "th" ? "รีเซ็ต 12 ฝ่ายมาตรฐาน" : "Reset 12 Depts"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingTeamId(null);
              setTeamName("");
              setTeamNameEn("");
              setTeamDescription("");
              setShowTeamModal(true);
            }}
            className="text-xs h-9 gap-1.5 cursor-pointer"
          >
            <Building className="h-4 w-4 text-emerald-600" />
            <span>{lang === "th" ? "+ เพิ่มฝ่ายใหม่" : "+ Add Department"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => router.push("/settings")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 shadow-sm cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{lang === "th" ? "⚙️ จัดการสมาชิก & สิทธิ์ ในหน้า Settings" : "⚙️ Manage Users in Settings"}</span>
          </Button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {notificationMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{notificationMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-3.5 rounded-xl border bg-card shadow-xs flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={lang === "th" ? "ค้นหาชื่อสมาชิก, อีเมล หรือชื่อฝ่าย..." : "Search members, email, or department..."}
            className="text-xs h-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[11px]">{t("roleLabel")}:</span>
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="h-8 text-xs rounded-md border bg-background px-2"
          >
            <option value="all">{lang === "th" ? "ทุกบทบาท (All Roles)" : "All Roles"}</option>
            <option value="admin">👑 Admin</option>
            <option value="manager">👔 Manager / Supervisor</option>
            <option value="member">👷 Member</option>
            <option value="viewer">👁️ Viewer</option>
          </select>
          <span className="text-muted-foreground text-[11px] pl-2 border-l">
            {lang === "th" ? `ผู้ใช้งานทั้งหมด ${safeUsers.length} คน` : `Total: ${safeUsers.length} users`}
          </span>
        </div>
      </div>

      {/* Role Explanation Reference Box (Section 2 RBAC) */}
      <div className="p-4 rounded-xl bg-card border shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">👑 Admin</span>
            <Badge variant="default" className="text-[9px]">{lang === "th" ? "เต็มรูปแบบ" : "Full Access"}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {lang === "th"
              ? "จัดการระบบทั้งหมด, เพิ่ม/ลบสมาชิก, มอบหมายงาน, ตรวจรับงาน (Review → Completed), ลบงาน"
              : "Full system authority: manage teams, assign tasks, review/complete deliverables, and delete tasks."}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 dark:text-amber-300">👔 Manager (Supervisor)</span>
            <Badge variant="high" className="text-[9px]">{lang === "th" ? "หัวหน้างาน" : "Supervisor"}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {lang === "th"
              ? "มอบหมายงาน, ปรับกำหนดส่ง, อนุมัติ/ตรวจรับงาน, ตีกลับงานแก้ไข, ดูภาพรวมทีม"
              : "Assign tasks, adjust deadlines, sign-off deliverables, reject for revisions, and oversee team workload."}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 dark:text-blue-300">👷 Member</span>
            <Badge variant="medium" className="text-[9px]">{lang === "th" ? "ผู้ปฏิบัติงาน" : "Assignee"}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {lang === "th"
              ? "ทำงานที่ได้รับมอบหมาย, เปลี่ยนสถานะเป็น in_progress/review, บันทึกปัญหา (Issue), ส่งคอมเมนต์"
              : "Execute assigned tasks, update progress to in_progress/review, log blocker issues, and submit outputs."}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300">👁️ Viewer</span>
            <Badge variant="outline" className="text-[9px]">{lang === "th" ? "ดูอย่างเดียว" : "Read-only"}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {lang === "th"
              ? "ดูความคืบหน้า Dashboard, Kanban Board, และรายงาน (ไม่สามารถแก้ไขข้อมูลได้)"
              : "View-only access to operational dashboards, Kanban boards, and reports (no modifications allowed)."}
          </p>
        </div>
      </div>

      {/* Teams and Users Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {safeTeams.map((team, index) => {
          if (!team || !team.id) return null;

          let teamMembers = safeUsers.filter((u) => u && u.team_id === team.id);

          if (selectedRoleFilter !== "all") {
            teamMembers = teamMembers.filter((u) => u.role === selectedRoleFilter);
          }

          if (searchFilter.trim()) {
            const q = searchFilter.trim().toLowerCase();
            const tName = (team.name || "").toLowerCase();
            const tNameEn = (team.name_en || "").toLowerCase();
            const matchTeam = tName.includes(q) || tNameEn.includes(q);
            if (!matchTeam) {
              teamMembers = teamMembers.filter(
                (u) =>
                  (u.full_name || "").toLowerCase().includes(q) ||
                  (u.email || "").toLowerCase().includes(q)
              );
              if (teamMembers.length === 0) return null;
            }
          }

          const displayTeamName = getLocalizedDynamicText(team.name || "ฝ่ายงาน", team.name_en, lang);
          const displayTeamDescription = getLocalizedDynamicText(team.description || "", null, lang);
          const sequenceNumber = String(index + 1).padStart(2, "0");

          return (
            <Card key={team.id} className="shadow-sm border flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
              <div>
                <CardHeader className="p-4 pb-3 border-b flex flex-row items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center h-5 w-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] shrink-0 border border-emerald-300 dark:border-emerald-800">
                        {sequenceNumber}
                      </span>
                      <Building className="h-4 w-4 text-emerald-600 shrink-0" />
                      <CardTitle className="text-xs font-bold text-foreground truncate">
                        {displayTeamName}
                      </CardTitle>
                    </div>
                    {displayTeamDescription && (
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed pl-7">
                        {displayTeamDescription}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="text-[10px]">
                      {teamMembers.length} {lang === "th" ? "คน" : "members"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingTeamId(team.id);
                        setTeamName(team.name || "");
                        setTeamNameEn(team.name_en || "");
                        setTeamDescription(team.description || "");
                        setShowTeamModal(true);
                      }}
                      className="h-7 w-7 p-0 cursor-pointer"
                      title={lang === "th" ? "แก้ไขข้อมูลฝ่าย" : "Edit Department"}
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-2.5">
                  {teamMembers.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3 text-center italic">
                      {lang === "th" ? "ยังไม่มีสมาชิกในฝ่ายนี้" : "No members assigned"}
                    </p>
                  ) : (
                    teamMembers.map((member) => {
                      if (!member || !member.id) return null;
                      const isCurrent = currentUser?.id === member.id;
                      const memberName = member.full_name || "สมาชิก";
                      const displayMemberName = getLocalizedDynamicText(memberName, null, lang);
                      const initialLetter = memberName.trim().charAt(0).toUpperCase() || "?";

                      return (
                        <div
                          key={member.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs group hover:shadow-xs hover:border-emerald-500/50 ${
                            isCurrent
                              ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-xs"
                              : "bg-background hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 border-border"
                          }`}
                        >
                          <div
                            onClick={() => router.push(`/tasks?assignee=${member.id}`)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                            title={lang === "th" ? `คลิกเพื่อดูกระดานงานของ ${memberName}` : `View tasks for ${memberName}`}
                          >
                            <Avatar className="h-8 w-8 border-2 border-background shrink-0">
                              <AvatarFallback className="font-bold text-xs">
                                {initialLetter}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-foreground group-hover:text-emerald-600 transition-colors truncate max-w-[160px]">
                                  {displayMemberName}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">
                                    {lang === "th" ? "คุณ" : "You"}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="flex items-center gap-1 truncate max-w-[130px]" title={member.email}>
                                  <Mail className="h-2.5 w-2.5 shrink-0" />
                                  {member.email || "no-email"}
                                </span>
                                {member.phone_number && (
                                  <a
                                    href={`tel:${member.phone_number}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:underline font-medium shrink-0"
                                    title={lang === "th" ? `โทรออกหา ${memberName}` : `Call ${memberName}`}
                                  >
                                    <Smartphone className="h-2.5 w-2.5" />
                                    {member.phone_number}
                                  </a>
                                )}
                                {member.line_user_id ? (
                                  <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5 shrink-0 text-[9px]">
                                    💬 LINE Active
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/60 text-[9px] flex items-center gap-0.5">
                                    ⚪ ไม่ได้ผูก LINE
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Role & Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            <Badge
                              variant={
                                member.role === "admin"
                                  ? "default"
                                  : member.role === "manager"
                                  ? "high"
                                  : "medium"
                              }
                              className="text-[9px] uppercase font-bold"
                            >
                              {member.role || "member"}
                            </Badge>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditUser(member);
                              }}
                              className="h-6 w-6 p-0 cursor-pointer"
                              title={lang === "th" ? "แก้ไขชื่อ / สิทธิ์" : "Edit user/role"}
                            >
                              <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                            </Button>

                            {safeUsers.length > 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(member);
                                }}
                                className="h-6 w-6 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                title={lang === "th" ? "ลบสมาชิก" : "Delete user"}
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </div>

              <div className="p-3 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenCreateUser(team.id)}
                  className="w-full text-xs h-7 border-dashed gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>{lang === "th" ? `+ เพิ่มสมาชิกเข้าฝ่ายนี้` : `+ Add Member to this department`}</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal 1: User Add / Edit Dialog */}
      {showUserModal && (
        <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
          <DialogContent className="max-w-md" onClose={() => setShowUserModal(false)}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <span>
                  {editingUserId
                    ? (lang === "th" ? "แก้ไขข้อมูลและสิทธิ์สมาชิก" : "Edit Member & Role")
                    : (lang === "th" ? "เพิ่มสมาชิกใหม่และกำหนดสิทธิ์ (Add Member)" : "Add New Member & Assign Role")}
                </span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block font-semibold mb-1 text-foreground">
                  {lang === "th" ? "ชื่อ-นามสกุล / ตำแหน่งที่ต้องการแสดง:" : "Full Name / Display Title:"} <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={lang === "th" ? "เช่น คุณนพดล (PM โครงการ), สมชาย วิศวกรสนาม" : "e.g. John Doe (Site Engineer)"}
                  className="text-xs"
                />
              </div>

              {/* Role (RBAC Selection) */}
              <div>
                <label className="block font-semibold mb-1 text-foreground">
                  {lang === "th" ? "กำหนดบทบาทและสิทธิ์ในระบบ (System Role / RBAC):" : "Assign System Role (RBAC):"} <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="text-xs"
                >
                  <option value="admin">👑 Admin ({lang === "th" ? "ผู้ดูแลระบบ — จัดการได้ทุกอย่าง / ตรวจรับงานได้" : "Full Admin Access"})</option>
                  <option value="manager">👔 Manager / Supervisor ({lang === "th" ? "ผู้จัดการ/หัวหน้างาน — มอบหมาย & ตรวจรับงาน" : "Supervisor / Reviewer"})</option>
                  <option value="member">👷 Member ({lang === "th" ? "ผู้ปฏิบัติงาน — ทำงาน / ส่งงานตรวจ / แจ้งปัญหา" : "Standard Assignee"})</option>
                  <option value="viewer">👁️ Viewer ({lang === "th" ? "ผู้สังเกตการณ์ — ดูข้อมูลได้อย่างเดียว" : "Read-only Viewer"})</option>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {lang === "th"
                    ? "สิทธิ์นี้จะควบคุม Workflow State Machine และการตรวจรับงานปิดงานอัตโนมัติ"
                    : "Controls State Machine transitions and deliverable approval authority automatically"}
                </p>
              </div>

              {/* Contact Information (Email & Phone) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div>
                  <label className="block font-semibold mb-1 text-foreground">
                    {lang === "th" ? "อีเมล (Email):" : "Email Address:"} <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@baansuay.com"
                    className="text-xs"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block font-semibold mb-1 text-foreground flex items-center justify-between">
                    <span>{lang === "th" ? "เบอร์โทรศัพท์:" : "Phone Number:"}</span>
                    <span className="text-[10px] text-muted-foreground">{lang === "th" ? "มีก็ใส่" : "Optional"}</span>
                  </label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="เช่น 081-234-5678"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Team */}
              <div>
                <label className="block font-semibold mb-1 text-foreground">
                  {lang === "th" ? "สังกัดฝ่ายงาน (Department / Team):" : "Assigned Department:"}
                </label>
                <Select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="text-xs"
                >
                  {safeTeams.map((t, idx) => (
                    <option key={t.id} value={t.id}>
                      {String(idx + 1).padStart(2, "0")}. {getLocalizedDynamicText(t.name || "ฝ่ายงาน", t.name_en, lang)}
                    </option>
                  ))}
                </Select>
              </div>

              {/* LINE User ID (For Direct 1-on-1 Multi-Push) */}
              <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{lang === "th" ? "LINE User ID สำหรับรับแจ้งเตือนส่วนตัว:" : "LINE User ID (Direct Push):"}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLineHelp(!showLineHelp)}
                    className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold hover:underline cursor-pointer"
                  >
                    {showLineHelp ? (lang === "th" ? "▲ ปิดคำแนะนำ" : "▲ Close Guide") : (lang === "th" ? "💡 วิธีดู Line ID คลิก" : "💡 How to get Line ID")}
                  </button>
                </div>

                <Input
                  value={lineUserId}
                  onChange={(e) => setLineUserId(e.target.value)}
                  placeholder="e.g. U8a9b7c6d5e4f3a2b1c0d9e8f7a6b5c4d (ขึ้นต้นด้วยตัว U)"
                  className="text-xs font-mono bg-background"
                />

                {showLineHelp && (
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border text-[11px] text-muted-foreground space-y-1.5 animate-in fade-in">
                    <p className="font-semibold text-foreground">
                      {lang === "th" ? "📱 ขั้นตอนการรับรหัส Line User ID (ทำครั้งเดียว):" : "📱 How to get your Line User ID:"}
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[10px]">
                      <li>
                        {lang === "th" ? "เพิ่มเพื่อน LINE OA ของระบบที่ LINE ID: " : "Add LINE OA: "}
                        <strong className="text-emerald-600 font-mono">@739cutlg</strong> (Faraday-ARCH)
                      </li>
                      <li>
                        {lang === "th" ? "พิมพ์ข้อความคำว่า " : "Send a message with "}
                        <strong className="text-emerald-600">ID</strong>
                        {lang === "th" ? " หรือ " : " or "}
                        <strong className="text-emerald-600">สวัสดี</strong>
                        {lang === "th" ? " ส่งเข้าไปในแชท" : " in chat"}
                      </li>
                      <li>
                        {lang === "th" ? "บอทจะตอบกลับรหัส User ID (เช่น U8a9b...) คัดลอกมากรอกในช่องนี้ได้ทันที" : "Copy the returned User ID and paste here."}
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserModal(false)}
                >
                  {lang === "th" ? "ยกเลิก" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  {lang === "th" ? "บันทึกข้อมูลสมาชิก" : "Save Member"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 2: Team Add / Edit Dialog */}
      {showTeamModal && (
        <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
          <DialogContent className="max-w-md" onClose={() => setShowTeamModal(false)}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Building className="h-5 w-5 text-emerald-600" />
                <span>
                  {editingTeamId
                    ? (lang === "th" ? "แก้ไขข้อมูลฝ่ายงาน" : "Edit Department")
                    : (lang === "th" ? "เพิ่มฝ่ายงานใหม่" : "Create New Department")}
                </span>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveTeam} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-foreground">
                  {lang === "th" ? "ชื่อฝ่ายงาน (ภาษาไทย):" : "Department Name (Thai):"} <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="เช่น ฝ่ายจัดซื้อและคลังวัสดุ"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-foreground">
                  {lang === "th" ? "ชื่อฝ่ายงาน (ภาษาอังกฤษ):" : "Department Name (English):"}
                </label>
                <Input
                  value={teamNameEn}
                  onChange={(e) => setTeamNameEn(e.target.value)}
                  placeholder="e.g. Procurement & Inventory Department"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-foreground">
                  {lang === "th" ? "หน้าที่ความรับผิดชอบของฝ่าย (คำอธิบาย):" : "Scope & Responsibility Description:"}
                </label>
                <Input
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder={lang === "th" ? "เช่น คุมสต็อกวัสดุ สั่งซื้อเหล็ก-ปูน ประสานงาน Supplier" : "e.g. Manage material inventory and supplier orders"}
                  className="text-xs"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTeamModal(false)}
                >
                  {lang === "th" ? "ยกเลิก" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  {lang === "th" ? "บันทึกฝ่ายงาน" : "Save Department"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
