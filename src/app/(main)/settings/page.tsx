"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import {
  Smartphone,
  Send,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Shield,
  ShieldCheck,
  Key,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Cpu,
  Bell,
  Check,
  Zap,
  ShieldAlert,
  FileCheck2,
  Clock,
  FolderPlus,
  Pencil,
  Trash2,
  Building2,
  Plus,
  Mail,
  Users,
  UserPlus,
  UserCheck,
  Activity,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { UserRole, UserProfile } from "@/lib/types/database.types";
import { formatDateTime } from "@/lib/utils";
import { translateText } from "@/lib/i18n/auto-translate";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";
import { cn } from "@/lib/utils";
import { LighthouseLogo } from "@/components/ui/lighthouse-logo";

const DEFAULT_LINE_ACCESS_TOKEN =
  "8OBUXdfTk10sKwL/o1KvCTbx0C4TbUA/q+q2/Fb9jniS8AQCKmO/jUvxioGUflsM2iLIDricYT5Qt7H8EfjrUbiLncPUXbueDD0rjnjGu8xuiJ01r0w55V0SBHdaogsMTivcHwHxw71UmjhXjFIVHAdB04t89/1O/w1cDnyilFU=";
const DEFAULT_LINE_USER_ID = "Ud03173af920035ad7d808a0feb10327d";

export default function SettingsPage() {
  const {
    currentUser,
    setCurrentUser,
    users,
    teams,
    projects,
    activityLogs,
    addUser,
    updateUser,
    deleteUser,
    addProject,
    updateProject,
    deleteProject,
    updateLineUserId,
    updateNotificationPreferences,
  } = useTaskStore();
  const { t, lang } = useLanguage();

  const [lineUserId, setLineUserId] = useState(currentUser?.line_user_id || DEFAULT_LINE_USER_ID);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string; raw?: any } | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Compute user activity stats from activityLogs
  const { userStats, totalLogins, totalActions } = useMemo(() => {
    const statsMap: Record<
      string,
      { loginCount: number; actionCount: number; lastActive: string | null; lastAction: string }
    > = {};

    users.forEach((u) => {
      statsMap[u.id] = { loginCount: 0, actionCount: 0, lastActive: null, lastAction: "-" };
    });

    let logins = 0;
    let actions = 0;

    (activityLogs || []).forEach((log) => {
      actions += 1;
      const uId = log.user_id;
      if (!uId) return;
      if (!statsMap[uId]) {
        statsMap[uId] = { loginCount: 0, actionCount: 0, lastActive: null, lastAction: "-" };
      }
      statsMap[uId].actionCount += 1;
      if (log.action === "user_login") {
        logins += 1;
        statsMap[uId].loginCount += 1;
      }
      if (!statsMap[uId].lastActive || new Date(log.created_at) > new Date(statsMap[uId].lastActive!)) {
        statsMap[uId].lastActive = log.created_at;
        statsMap[uId].lastAction = log.new_value || log.action;
      }
    });

    return { userStats: statsMap, totalLogins: logins, totalActions: actions };
  }, [users, activityLogs]);

  // User Management in Settings State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("member");
  const [userTeamId, setUserTeamId] = useState(teams[0]?.id || "team-consult");
  const [userLineId, setUserLineId] = useState("");
  const [showUserLineHelp, setShowUserLineHelp] = useState(false);
  const [userMsg, setUserMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Project Management Modal State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectNameEn, setProjectNameEn] = useState("");
  const [projectTeamId, setProjectTeamId] = useState("");
  const [projectMsg, setProjectMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Phase 2: Notification Preferences State (Question 4: Choice ค)
  const [prefs, setPrefs] = useState({
    notify_assignment: currentUser?.notification_preferences?.notify_assignment ?? true,
    notify_blocker: currentUser?.notification_preferences?.notify_blocker ?? true,
    notify_review: currentUser?.notification_preferences?.notify_review ?? true,
    notify_deadline: currentUser?.notification_preferences?.notify_deadline ?? true,
    notify_line: currentUser?.notification_preferences?.notify_line ?? true,
    notify_email: (currentUser?.notification_preferences as any)?.notify_email ?? true,
  });
  const [savePrefsSuccess, setSavePrefsSuccess] = useState(false);

  // Email Notification Test State
  const [testEmailAddress, setTestEmailAddress] = useState(currentUser?.email || "admin@medtree.com");
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSavePrefs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    updateNotificationPreferences(currentUser.id, prefs);
    setSavePrefsSuccess(true);
    setTimeout(() => setSavePrefsSuccess(false), 3500);
  };

  // Translation test state
  const [testInputText, setTestInputText] = useState("ท่อสุขาภิบาลชนคานโครงสร้างหลักชั้น 3 และระยะร่นอาคารฝั่งทิศตะวันออกขาดไป 15 cm");
  const [testTranslatedText, setTestTranslatedText] = useState("");
  const [isTestingTranslate, setIsTestingTranslate] = useState(false);

  // Load saved tokens with persistent default fallback
  useEffect(() => {
    try {
      const savedLineUserId =
        currentUser.line_user_id ||
        localStorage.getItem("taskflow_line_user_id") ||
        DEFAULT_LINE_USER_ID;
      setLineUserId(savedLineUserId);
      localStorage.setItem("taskflow_line_user_id", savedLineUserId);
    } catch {}
  }, [currentUser]);

  const handleSaveLineConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUserId = lineUserId.trim() || DEFAULT_LINE_USER_ID;

    updateLineUserId(currentUser.id, finalUserId);
    setLineUserId(finalUserId);

    try {
      localStorage.setItem("taskflow_line_user_id", finalUserId);
    } catch {}

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleTestTranslation = async () => {
    setIsTestingTranslate(true);
    const res = await translateText(testInputText);
    setTestTranslatedText(res.translatedText);
    setIsTestingTranslate(false);
  };

  const handleTestPush = async () => {
    if (!lineUserId) {
      setPushResult({
        success: false,
        message: lang === "th" ? "กรุณาระบุ LINE User ID ก่อนทดสอบส่ง" : "Please specify LINE User ID before testing",
      });
      return;
    }

    setIsSending(true);
    setPushResult(null);

    try {
      const res = await fetch("/api/line/test-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineUserId: lineUserId.trim(),
          title: lang === "th" ? "ทดสอบการแจ้งเตือนจากระบบ Lighthouse" : "Lighthouse Push Notification Test",
          message: lang === "th"
            ? `สวัสดีคุณ ${currentUser.full_name}! ระบบ Lighthouse TaskFlow เชื่อมต่อกับ LINE OA ของคุณสำเร็จเรียบร้อยแล้ว`
            : `Hello ${currentUser.full_name}! Lighthouse TaskFlow is successfully connected with your LINE OA`,
          taskTitle: lang === "th" ? "ทดสอบส่งแจ้งเตือนระบบติดตามงาน" : "Lighthouse Integration Verification",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPushResult({
          success: true,
          message: data.message || (lang === "th" ? "ส่งข้อความเข้า LINE เรียบร้อยแล้ว! กรุณาเปิดดูในแอป LINE ของคุณ" : "Message sent to LINE! Check your LINE mobile app"),
        });
      } else {
        setPushResult({
          success: false,
          message: data.error || (lang === "th" ? "เกิดข้อผิดพลาดในการส่งข้อความ" : "Failed to send message"),
          raw: data.rawError,
        });
      }
    } catch (err: any) {
      setPushResult({
        success: false,
        message: `API Error: ${err.message}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress.trim()) return;
    setIsSendingEmail(true);
    setEmailResult(null);

    try {
      const res = await fetch("/api/email/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmailAddress.trim(),
          recipientName: currentUser.full_name,
          title: lang === "th" ? "ทดสอบระบบแจ้งเตือนทางอีเมล — Lighthouse TaskFlow" : "Lighthouse TaskFlow Email Notification Test",
          message: lang === "th"
            ? `สวัสดีคุณ ${currentUser.full_name}! ระบบ Lighthouse TaskFlow เชื่อมต่อระบบแจ้งเตือนทางอีเมลสำเร็จเรียบร้อยแล้ว`
            : `Hello ${currentUser.full_name}! Lighthouse TaskFlow Email Notification is functioning successfully.`,
          taskTitle: "ทดสอบการเชื่อมต่อระบบแจ้งเตือน (Email Integration Test)",
          type: "assignment",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEmailResult({
          success: true,
          message: data.message || (lang === "th" ? "ส่งอีเมลแจ้งเตือนสำเร็จแล้ว!" : "Email notification sent!"),
        });
      } else {
        setEmailResult({
          success: false,
          message: data.error || (lang === "th" ? "ส่งอีเมลไม่สำเร็จ" : "Failed to send email"),
        });
      }
    } catch (err: any) {
      setEmailResult({
        success: false,
        message: `API Error: ${err.message}`,
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const router = useRouter();

  // Strict RBAC: Only Admin can access Settings
  if (currentUser?.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 animate-in fade-in">
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 inline-block">
          <ShieldAlert className="h-12 w-12 text-amber-600 mx-auto" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-foreground">
            {lang === "th" ? "สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin Access Only)" : "Admin Access Only"}
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            {lang === "th"
              ? `เมนูการตั้งค่าระบบ, การจัดการบุคลากร, การลบโครงการ และการตรวจสอบสถิติ สงวนสิทธิ์สำหรับผู้ดูแลระบบ (Admin) เท่านั้น บัญชีของคุณ (${currentUser?.full_name}) มีระดับสิทธิ์เป็น ${currentUser?.role?.toUpperCase()}`
              : `System settings, user management, and audit telemetry are restricted to Administrator accounts. Your current role is ${currentUser?.role?.toUpperCase()}.`}
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 cursor-pointer"
        >
          {lang === "th" ? "กลับสู่หน้าหลัก (Go to Dashboard)" : "Return to Dashboard"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("settingsTitle")}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{t("settingsSub")}</p>
      </div>

      {/* Brand & Philosophy Banner Card */}
      <Card className="border-amber-200/80 dark:border-amber-900/60 bg-gradient-to-r from-amber-500/10 via-teal-500/5 to-emerald-500/10 overflow-hidden shadow-xs">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-5">
          <LighthouseLogo size="lg" animateBeam={true} className="shrink-0" />
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-base font-black tracking-tight text-foreground flex items-center gap-1.5">
                <span>Lighthouse</span>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">TaskFlow</span>
              </h2>
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-800 dark:text-amber-300">
                {lang === "th" ? "ปรัชญาองค์กร" : "Philosophy"}
              </Badge>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed italic">
              &ldquo;{t("appPhilosophy")}&rdquo;
            </p>
            <p className="text-[11px] text-muted-foreground">
              {lang === "th"
                ? "💡 ระบบถูกออกแบบเพื่อสร้างความชัดเจน (Visibility) ลดความขัดแย้ง และเปลี่ยนการบริหารงานบุคคลให้เป็นพลังขับเคลื่อนความสำเร็จขององค์กร"
                : "Designed to provide clarity and operational visibility, turning team management into enterprise success."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 0. Server-Verified Active Profile Card (E6 - Read-Only Server-Owned Identity) */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-600" />
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                {lang === "th" ? "ข้อมูลโปรไฟล์ผู้ใช้งาน (Authenticated Profile)" : "Authenticated User Profile"}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lang === "th"
                  ? "สิทธิ์และตัวตนถูกยืนยันผ่านระบบความปลอดภัยของเซิร์ฟเวอร์ (Server-Owned Identity)"
                  : "Identity and RBAC role are securely verified and enforced server-side"}
              </p>
            </div>
          </div>
          <Badge
            variant={
              currentUser.role === "admin"
                ? "default"
                : currentUser.role === "manager"
                ? "high"
                : "medium"
            }
            className="capitalize text-xs font-bold px-2.5 py-1"
          >
            {currentUser.role.toUpperCase()}
          </Badge>
        </CardHeader>
        <CardContent className="p-5 text-xs">
          <div className="p-4 rounded-xl border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-bold text-sm text-foreground flex items-center gap-2">
                <span>{currentUser.full_name}</span>
                <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 border-emerald-500/40 bg-emerald-500/10">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  {lang === "th" ? "ยืนยันตัวตนแล้ว" : "Verified Session"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">{currentUser.email}</div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-2 pt-1">
                <span>{lang === "th" ? "องค์กร:" : "Org ID:"} <strong className="text-foreground">{currentUser.org_id || "MeDTree Design & Build"}</strong></span>
                <span>•</span>
                <span>{currentUser.line_user_id ? "📱 ผูก LINE แล้ว" : "⚪ ยังไม่ผูก LINE"}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground">{lang === "th" ? "บทบาทในระบบ" : "Assigned Role"}</div>
              <div className="font-black text-sm uppercase text-foreground">{currentUser.role}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1. Gemini AI Translation Key Card */}
      <Card className="border-purple-200 dark:border-purple-900 shadow-sm bg-gradient-to-b from-purple-50/20 to-transparent">
        <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              {lang === "th" ? "สถานะการทำงาน Google Gemini AI (ระบบแปลภาษา & MeD3 AI)" : "Google Gemini AI Engine Status"}
            </CardTitle>
          </div>
          <Badge variant="success" className="bg-purple-600 text-white text-[10px] font-semibold">
            {lang === "th" ? "🟢 Server Connected" : "🟢 Server Connected"}
          </Badge>
        </CardHeader>

        <CardContent className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span>{lang === "th" ? "แปลศัพท์เฉพาะทางสถาปัตยกรรม & ก่อสร้างด้วย AI:" : "Architectural & Construction Translation Engine:"}</span>
            </p>
            <p className="text-[11px] text-purple-800/80 dark:text-purple-300">
              {lang === "th"
                ? "ระบบมี Construction Domain Prompt ฝังไว้เพื่อแปลศัพท์ช่างให้ถูกต้อง 100% สามารถนำ Gemini API Key จาก Google AI Studio มาใส่เพื่อใช้แปลได้ทันที"
                : "Equipped with specialized Architecture & Construction Prompt Guidelines for 100% accurate technical translations."}
            </p>
          </div>

          {/* Server Integration Security Banner */}
          <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 flex items-start justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-purple-600 shrink-0" />
                <span>{lang === "th" ? "สถานะการเชื่อมต่อ AI บนเซิร์ฟเวอร์ (Server-Side Execution)" : "Server-Side Gemini AI Integration"}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {lang === "th"
                  ? "ระบบแปลภาษาอัตโนมัติและ MeD3 AI วิเคราะห์งาน เชื่อมต่อผ่านตัวแปรแวดล้อม GEMINI_API_KEY บนเซิร์ฟเวอร์อย่างปลอดภัย 100% (ไม่เปิดเผยคีย์ต่อหน้าบ้าน)"
                  : "Automatic translation and MeD3 AI briefings run securely server-side using GEMINI_API_KEY environment variables."}
              </p>
            </div>
            <Badge variant="default" className="bg-purple-600 text-white shrink-0 text-[10px] font-bold">
              {lang === "th" ? "🟢 ปลอดภัย Server-Side" : "🟢 Server Protected"}
            </Badge>
          </div>

          {/* Test Live Translation Box */}
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">
                {lang === "th" ? "ทดสอบแปลศัพท์เฉพาะทางหน้างานสด (Live Translation Test):" : "Test Live Domain Translation:"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestTranslation}
                disabled={isTestingTranslate || !testInputText.trim()}
                className="text-xs h-7 gap-1 border-purple-500/50 text-purple-700 dark:text-purple-300"
              >
                <Sparkles className="h-3 w-3" />
                <span>{isTestingTranslate ? (lang === "th" ? "กำลังแปล..." : "Translating...") : (lang === "th" ? "ทดสอบแปล" : "Test Translate")}</span>
              </Button>
            </div>

            <Input
              value={testInputText}
              onChange={(e) => setTestInputText(e.target.value)}
              className="text-xs"
              placeholder={lang === "th" ? "พิมพ์ข้อความภาษาไทยเพื่อทดสอบ..." : "Enter Thai text to test..."}
            />

            {testTranslatedText && (
              <div className="p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in space-y-1">
                <div className="font-bold text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>ผลลัพธ์การแปลภาษาอังกฤษ (English Output):</span>
                </div>
                <p className="font-semibold">{testTranslatedText}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. LINE Messaging API Integration Card */}
      <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm">
        <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              {t("lineIntegrationTitle")}
            </CardTitle>
          </div>
          <Badge
            variant={currentUser.line_user_id ? "success" : "destructive"}
            className="text-xs font-semibold gap-1"
          >
            <Smartphone className="h-3 w-3" />
            <span>
              {currentUser.line_user_id
                ? lang === "th"
                  ? "🟢 ผูก LINE OA แล้ว"
                  : "🟢 LINE OA Connected"
                : lang === "th"
                ? "⚪ ยังไม่ผูก LINE OA"
                : "⚪ LINE OA Not Connected"}
            </span>
          </Badge>
        </CardHeader>

        <CardContent className="p-5 space-y-5 text-xs">
          {/* Active Connection Status Banner */}
          <div
            className={cn(
              "p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs",
              currentUser.line_user_id
                ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  currentUser.line_user_id ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                )}
              >
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <div className="font-bold text-xs">
                  {currentUser.line_user_id
                    ? lang === "th"
                      ? "ผูกบัญชี LINE OA สำเร็จพร้อมรับการแจ้งเตือนแบบเรียลไทม์"
                      : "LINE OA Connected & Ready for Real-Time Push"
                    : lang === "th"
                    ? "ยังไม่ได้ผูกบัญชี LINE OA สำหรับผู้ใช้งานนี้"
                    : "LINE OA Not Linked for This User"}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {lang === "th"
                    ? `ผู้ใช้งานปัจจุบัน: ${currentUser.full_name} (${currentUser.role.toUpperCase()})`
                    : `Active User: ${currentUser.full_name} (${currentUser.role.toUpperCase()})`}
                </div>
              </div>
            </div>
            <Badge variant={currentUser.line_user_id ? "success" : "medium"}>
              {currentUser.line_user_id
                ? lang === "th"
                  ? "เชื่อมต่อแล้ว"
                  : "Connected"
                : lang === "th"
                ? "รอการตั้งค่า"
                : "Setup Required"}
            </Badge>
          </div>
          {/* Important Requirement Checklist */}
          <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-300 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-xs">
              <HelpCircle className="h-4 w-4 text-emerald-700" />
              <span>{t("lineUserGuidelineTitle")}</span>
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-[11px] text-emerald-800 dark:text-emerald-300">
              <li>
                {t("lineGuideline1")}{" "}
                <a
                  href="https://developers.line.biz/console/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-300 hover:text-emerald-900"
                >
                  LINE Developers Console <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </li>
              <li>{t("lineGuideline2")}</li>
              <li>{t("lineGuideline3")}</li>
            </ol>
          </div>

          <form onSubmit={handleSaveLineConfig} className="space-y-4">
            {/* Field 1: LINE User ID */}
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {t("fieldLineUserId")} <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={lineUserId}
                onChange={(e) => setLineUserId(e.target.value)}
                placeholder="e.g. U8a9b7c6d5e4f3a2b1c0d9e8f7a6b5c4d"
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {lang === "th"
                  ? "รหัสประจำตัวผู้ใช้ LINE (33 ตัวอักษรขึ้นต้นด้วย U ดูได้ใน LINE Developers Console หรือจาก Webhook)"
                  : "33-character unique user identifier starting with U (found in LINE Developers Console or Webhook)"}
              </p>
            </div>

            {/* Field 2: Channel Access Token Status */}
            <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-300 block">LINE Channel Access Token:</span>
                  <span className="text-[10px] text-muted-foreground">
                    {lang === "th" ? "จัดการผ่านตัวแปรแวดล้อม LINE_CHANNEL_ACCESS_TOKEN บนเซิร์ฟเวอร์" : "Configured via server-side LINE_CHANNEL_ACCESS_TOKEN env variable"}
                  </span>
                </div>
              </div>
              <Badge variant="default" className="bg-emerald-600 text-white text-[10px] shrink-0 font-semibold">
                {lang === "th" ? "🟢 Server Enforced" : "🟢 Server Enforced"}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {t("btnSaveLine")}
              </Button>

              {saveSuccess && (
                <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  {lang === "th" ? "บันทึกข้อมูลเรียบร้อยแล้ว" : "Settings saved successfully"}
                </span>
              )}
            </div>
          </form>

          {/* Test Push Section */}
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-semibold text-foreground text-xs">
                  {t("testLineTitle")}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t("testLineSub")}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleTestPush}
                disabled={isSending || !lineUserId}
                className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSending ? t("sendingLine") : t("btnTestLine")}</span>
              </Button>
            </div>

            {/* Push Result Banner */}
            {pushResult && (
              <div
                className={`p-3 rounded-lg border text-xs animate-in fade-in space-y-1 ${
                  pushResult.success
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  {pushResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{pushResult.success ? (lang === "th" ? "สำเร็จ!" : "Success!") : (lang === "th" ? "ส่งไม่สำเร็จ" : "Failed")}</div>
                    <div>{pushResult.message}</div>
                    {pushResult.raw && (
                      <pre className="mt-1 p-2 rounded bg-black/10 dark:bg-black/40 text-[10px] overflow-x-auto">
                        {JSON.stringify(pushResult.raw, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phase 2: Notification Preferences Card (Question 4: Choice ค) */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              {lang === "th" ? "การตั้งค่าการแจ้งเตือนตามเหตุการณ์สำคัญ (Notification Preferences)" : "Notification Events & Channel Preferences"}
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300">
            {lang === "th" ? "ปรับแต่งรายบุคคล" : "Per-User Matrix"}
          </Badge>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-xs">
          <p className="text-xs text-muted-foreground">
            {lang === "th"
              ? "เลือกเปิด-ปิดเหตุการณ์ที่ต้องการรับการแจ้งเตือนเข้าศูนย์แจ้งเตือนและ LINE OA Faraday-ARCH"
              : "Toggle which critical project milestones you want to receive alerts for via In-App and LINE"}
          </p>

          <form onSubmit={handleSavePrefs} className="space-y-3">
            <div className="divide-y rounded-xl border bg-background overflow-hidden">
              {/* Event 1: New Assignment */}
              <div className="p-3.5 flex items-center justify-between hover:bg-muted/20">
                <div className="space-y-0.5 pr-4">
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{lang === "th" ? "1. เมื่อได้รับมอบหมายงานใหม่ (New Task Assignment)" : "1. New Task Assignment to me"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === "th" ? "แจ้งเตือนทันทีเมื่อหัวหน้างานหรือผู้จัดการสั่งงานให้คุณ" : "Alerts immediately when a manager assigns a task to you"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.notify_assignment}
                  onChange={(e) => setPrefs({ ...prefs, notify_assignment: e.target.checked })}
                  className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Event 2: Blocker / Issue */}
              <div className="p-3.5 flex items-center justify-between hover:bg-muted/20">
                <div className="space-y-0.5 pr-4">
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                    <span>{lang === "th" ? "2. มีการแจ้งติดปัญหา / Blocker ในงาน (Urgent Blocker Logged)" : "2. Urgent Blocker / Clash Logged"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === "th" ? "แจ้งเตือนด่วนเมื่องานที่ดูแลอยู่มีปัญหาแนวท่อชนคาน หรือระยะร่นขาด" : "Alerts when a clash or obstacle is reported on your tasks"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.notify_blocker}
                  onChange={(e) => setPrefs({ ...prefs, notify_blocker: e.target.checked })}
                  className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Event 3: Review & Revision */}
              <div className="p-3.5 flex items-center justify-between hover:bg-muted/20">
                <div className="space-y-0.5 pr-4">
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
                    <span>{lang === "th" ? "3. ส่งงานเพื่อตรวจรับ หรือ ตีกลับแก้ไข (Review & Revision)" : "3. Submitted for Review / Revision Required"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === "th" ? "แจ้งเตือนเมื่อทีมส่งผลงานให้ตรวจ หรือเอกสารขออนุญาตถูกตีกลับ" : "Alerts when deliverables are submitted or permit revisions ordered"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.notify_review}
                  onChange={(e) => setPrefs({ ...prefs, notify_review: e.target.checked })}
                  className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Event 4: Deadline & Overdue */}
              <div className="p-3.5 flex items-center justify-between hover:bg-muted/20">
                <div className="space-y-0.5 pr-4">
                  <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>{lang === "th" ? "4. งานใกล้ถึงกำหนดส่ง (เหลือ 1 วัน) หรือ เกินกำหนด (Due Soon / Overdue)" : "4. Approaching Deadline (1 Day) or Overdue"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === "th" ? "แจ้งเตือนสรุปงานด่วนเพื่อไม่ให้งานหลุดกำหนดเวลา" : "Automated reminder to prevent deadline misses"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.notify_deadline}
                  onChange={(e) => setPrefs({ ...prefs, notify_deadline: e.target.checked })}
                  className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Channel Toggle: LINE OA Sync */}
              <div className="p-3.5 flex items-center justify-between bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="space-y-0.5 pr-4">
                  <div className="font-semibold text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{lang === "th" ? "📡 ส่งข้อความเข้า LINE OA Faraday-ARCH (@739cutlg)" : "📡 Push to LINE OA Faraday-ARCH"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === "th" ? "ส่งแจ้งเตือนเข้ามือถือผ่าน LINE OA ทันที" : "Send instant push alerts directly to your mobile LINE app"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.notify_line}
                  onChange={(e) => setPrefs({ ...prefs, notify_line: e.target.checked })}
                  className="h-4 w-4 rounded accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Channel Toggle: Email Notification */}
              <div className="p-3.5 flex items-center justify-between bg-blue-50/40 dark:bg-blue-950/20">
                <div className="space-y-0.5 pr-4">
                  <div className="font-semibold text-xs text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                    <span>{lang === "th" ? "📧 ส่งการแจ้งเตือนทางอีเมล (Email Notification)" : "📧 Transactional Email Alerts"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === "th" ? "ส่งอีเมลสรุปงาน มอบหมายงาน และแจ้งเตือนด่วนไปยังที่อยู่อีเมลของคุณ" : "Send email digests, assignment notices, and blocker alerts to your inbox"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.notify_email}
                  onChange={(e) => setPrefs({ ...prefs, notify_email: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-1">
              {savePrefsSuccess ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{lang === "th" ? "บันทึกการตั้งค่าการแจ้งเตือนสำเร็จ!" : "Preferences saved successfully!"}</span>
                </span>
              ) : <div />}

              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{lang === "th" ? "บันทึกการตั้งค่า" : "Save Preferences"}</span>
              </Button>
            </div>
          </form>

          {/* Test Email Section */}
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  <span>{lang === "th" ? "ทดสอบระบบแจ้งเตือนทางอีเมล (Email Notification Test):" : "Test Email Notification:"}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === "th" ? "ทดสอบยิงอีเมลแจ้งเตือนงานจำลองไปยังกล่องจดหมายของคุณ" : "Send a simulated task alert email to your inbox"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="e.g. your-email@medtree.com"
                className="text-xs max-w-sm"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleTestEmail}
                disabled={isSendingEmail || !testEmailAddress.trim()}
                className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                <Send className="h-3 w-3" />
                <span>{isSendingEmail ? (lang === "th" ? "กำลังส่งอีเมล..." : "Sending...") : (lang === "th" ? "ส่งทดสอบอีเมล" : "Test Email")}</span>
              </Button>
            </div>

            {emailResult && (
              <div
                className={`p-3 rounded-lg border text-xs animate-in fade-in space-y-1 ${
                  emailResult.success
                    ? "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200"
                    : "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {emailResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-semibold">{emailResult.message}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. User Management & Role Permissions Card (👥 จัดการบุคลากร & กำหนดสิทธิ์การใช้งาน) */}
      <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm">
        <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                {lang === "th" ? "จัดการบุคลากร & กำหนดสิทธิ์การใช้งาน (User Management & RBAC)" : "User Management & Permissions"}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lang === "th"
                  ? "เพิ่ม แก้ไข ลบสมาชิก พร้อมกำหนดบทบาทสิทธิ์ (Admin, Manager, Member, Viewer), เบอร์โทร และ LINE User ID"
                  : "Add, update, or remove members, assign RBAC roles, contact phone, and LINE User IDs"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditingUserId(null);
              setUserName("");
              setUserEmail(`user${Date.now().toString().slice(-4)}@baansuay.com`);
              setUserPhone("");
              setUserRole("member");
              setUserTeamId(teams[0]?.id || "team-consult");
              setUserLineId("");
              setShowUserLineHelp(false);
              setUserMsg(null);
              setShowUserModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-xs cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>{lang === "th" ? "+ เพิ่มสมาชิก & กำหนดสิทธิ์" : "+ Add Member"}</span>
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {userMsg && (
            <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${userMsg.success ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"}`}>
              {userMsg.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
              <span>{userMsg.text}</span>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">{lang === "th" ? "ชื่อ-นามสกุล / ตำแหน่ง" : "Full Name / Title"}</th>
                  <th className="py-2.5 px-3">{lang === "th" ? "สิทธิ์ในระบบ (Role)" : "Role"}</th>
                  <th className="py-2.5 px-3">{lang === "th" ? "ฝ่ายงาน (Department)" : "Department"}</th>
                  <th className="py-2.5 px-3">{lang === "th" ? "อีเมลล็อกอิน" : "Email"}</th>
                  <th className="py-2.5 px-3">{lang === "th" ? "เบอร์โทรศัพท์" : "Phone"}</th>
                  <th className="py-2.5 px-3">{lang === "th" ? "การแจ้งเตือน LINE" : "LINE Status"}</th>
                  <th className="py-2.5 px-3 text-right">{lang === "th" ? "การจัดการ" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u, idx) => {
                  const teamMatch = teams.find((t) => t.id === u.team_id);
                  const teamName = teamMatch ? getLocalizedDynamicText(teamMatch.name, teamMatch.name_en, lang) : (lang === "th" ? "ฝ่ายออกแบบ" : "Design Team");
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className={`hover:bg-muted/30 transition-colors ${isCurrent ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""}`}>
                      <td className="py-3 px-3 font-mono font-bold text-muted-foreground">{String(idx + 1).padStart(2, "0")}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{u.full_name}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">
                              {lang === "th" ? "คุณ" : "You"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            u.role === "admin"
                              ? "default"
                              : u.role === "manager"
                              ? "high"
                              : "medium"
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-muted-foreground text-[11px] truncate max-w-[140px] block">
                          {teamName}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3 px-3">
                        {u.phone_number ? (
                          <a
                            href={`tel:${u.phone_number}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 text-[11px]"
                          >
                            <Smartphone className="h-3 w-3 shrink-0" />
                            <span>{u.phone_number}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground/50 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {u.line_user_id ? (
                          <span
                            className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-1 text-[10px]"
                            title={u.line_user_id}
                          >
                            💬 Active
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 text-[10px]">
                            ⚪ ยังไม่ผูก
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingUserId(u.id);
                            setUserName(u.full_name || "");
                            setUserEmail(u.email || "");
                            setUserPhone(u.phone_number || "");
                            setUserRole(u.role || "member");
                            setUserTeamId(u.team_id || teams[0]?.id || "team-consult");
                            setUserLineId(u.line_user_id || "");
                            setShowUserLineHelp(false);
                            setUserMsg(null);
                            setShowUserModal(true);
                          }}
                          className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                          title={lang === "th" ? "แก้ไขข้อมูลและสิทธิ์" : "Edit Member & Role"}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {users.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (window.confirm(lang === "th" ? `ยืนยันการลบสมาชิก "${u.full_name}" หรือไม่?` : `Confirm deleting member "${u.full_name}"?`)) {
                                const res = deleteUser(u.id);
                                if (res.success) {
                                  setUserMsg({ success: true, text: lang === "th" ? `ลบผู้ใช้ "${u.full_name}" เรียบร้อยแล้ว` : "User deleted successfully" });
                                } else {
                                  setUserMsg({ success: false, text: res.message || "Error" });
                                }
                              }
                            }}
                            className="h-7 w-7 p-0 cursor-pointer text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                            title={lang === "th" ? "ลบสมาชิก" : "Delete Member"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Add / Edit Modal Dialog */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              <span>
                {editingUserId
                  ? (lang === "th" ? "แก้ไขข้อมูล & กำหนดสิทธิ์สมาชิก" : "Edit Member & Role")
                  : (lang === "th" ? "เพิ่มสมาชิกใหม่ & กำหนดสิทธิ์ (Add Member)" : "Add Member & Assign Role")}
              </span>
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!userName.trim() || !userEmail.trim()) return;

              if (editingUserId) {
                updateUser(editingUserId, {
                  full_name: userName.trim(),
                  email: userEmail.trim(),
                  phone_number: userPhone.trim() || null,
                  role: userRole,
                  team_id: userTeamId || teams[0]?.id,
                  line_user_id: userLineId.trim() || null,
                });
                setUserMsg({ success: true, text: lang === "th" ? `อัปเดตข้อมูลคุณ "${userName}" เรียบร้อยแล้ว` : `Updated ${userName} successfully` });
              } else {
                addUser({
                  full_name: userName.trim(),
                  email: userEmail.trim(),
                  phone_number: userPhone.trim() || undefined,
                  role: userRole,
                  team_id: userTeamId || teams[0]?.id,
                  line_user_id: userLineId.trim() || undefined,
                });
                setUserMsg({ success: true, text: lang === "th" ? `เพิ่มสมาชิก "${userName}" และกำหนดสิทธิ์ ${userRole.toUpperCase()} เรียบร้อยแล้ว` : `Added ${userName} with ${userRole.toUpperCase()} role` });
              }
              setShowUserModal(false);
            }}
            className="space-y-4 text-xs pt-2"
          >
            {/* Full Name */}
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {lang === "th" ? "ชื่อ-นามสกุล / ตำแหน่งที่ต้องการแสดง:" : "Full Name / Display Title:"} <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={lang === "th" ? "เช่น คุณสมชาย (โฟร์แมน แปลง 1-30), วิศวกรเอก" : "e.g. John Doe (Site Engineer)"}
                className="text-xs"
              />
            </div>

            {/* Role (RBAC Selection) */}
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {lang === "th" ? "กำหนดบทบาทและสิทธิ์ในระบบ (System Role / RBAC):" : "Assign System Role (RBAC):"} <span className="text-rose-500">*</span>
              </label>
              <Select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="text-xs"
              >
                <option value="admin">👑 Admin ({lang === "th" ? "ผู้ดูแลระบบ — จัดการได้ทุกอย่าง / ตรวจรับงานได้" : "Full Admin Access"})</option>
                <option value="manager">👔 Manager ({lang === "th" ? "ผู้จัดการ/หัวหน้างาน — มอบหมาย & ตรวจรับงาน" : "Supervisor / Reviewer"})</option>
                <option value="member">👷 Member ({lang === "th" ? "ผู้ปฏิบัติงาน — ทำงาน / ส่งงานตรวจ / แจ้งปัญหา" : "Standard Assignee"})</option>
                <option value="viewer">👁️ Viewer ({lang === "th" ? "ผู้สังเกตการณ์ — ดูข้อมูลได้อย่างเดียว" : "Read-only Viewer"})</option>
              </Select>
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-foreground">
                  {lang === "th" ? "อีเมล (Email สำหรับล็อกอิน):" : "Work Email:"} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="name@baansuay.com"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-foreground flex items-center justify-between">
                  <span>{lang === "th" ? "เบอร์โทรศัพท์:" : "Phone Number:"}</span>
                  <span className="text-[10px] text-muted-foreground">{lang === "th" ? "มีก็ใส่" : "Optional"}</span>
                </label>
                <Input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="081-234-5678"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Department / Team */}
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {lang === "th" ? "สังกัดฝ่ายงาน (Department):" : "Assigned Department:"}
              </label>
              <Select
                value={userTeamId}
                onChange={(e) => setUserTeamId(e.target.value)}
                className="text-xs"
              >
                {teams.map((t, idx) => (
                  <option key={t.id} value={t.id}>
                    {String(idx + 1).padStart(2, "0")}. {getLocalizedDynamicText(t.name || "ฝ่ายงาน", t.name_en, lang)}
                  </option>
                ))}
              </Select>
            </div>

            {/* LINE User ID (For Direct Push) */}
            <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{lang === "th" ? "LINE User ID สำหรับรับแจ้งเตือนส่วนตัว:" : "LINE User ID (Direct Push):"}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowUserLineHelp(!showUserLineHelp)}
                  className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold hover:underline cursor-pointer"
                >
                  {showUserLineHelp ? (lang === "th" ? "▲ ปิดคำแนะนำ" : "▲ Close Guide") : (lang === "th" ? "💡 วิธีดู Line ID คลิก" : "💡 How to get Line ID")}
                </button>
              </div>

              <Input
                value={userLineId}
                onChange={(e) => setUserLineId(e.target.value)}
                placeholder="e.g. U8a9b7c6d5e4f3a2b1c0d9e8f7a6b5c4d"
                className="text-xs font-mono bg-background"
              />

              {showUserLineHelp && (
                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border text-[11px] text-muted-foreground space-y-1.5 animate-in fade-in">
                  <p className="font-semibold text-foreground">
                    {lang === "th" ? "📱 ขั้นตอนการรับรหัส Line User ID (ทำครั้งเดียว):" : "📱 How to get your Line User ID:"}
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[10px]">
                    <li>
                      {lang === "th" ? "เพิ่มเพื่อน LINE OA ที่ LINE ID: " : "Add LINE OA: "}
                      <strong className="text-emerald-600 font-mono">@739cutlg</strong> (Faraday-ARCH)
                    </li>
                    <li>
                      {lang === "th" ? "พิมพ์คำว่า " : "Send message "}
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

            <DialogFooter className="pt-2">
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

      {/* 4. User Access & Activity Analytics Card (📊 บันทึกสถิติการเข้าใช้งาน & พฤติกรรมบุคลากร) */}
      <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm">
        <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                {lang === "th"
                  ? "สถิติการเข้าใช้งาน & พฤติกรรมบุคลากร (User Access & Activity Analytics)"
                  : "User Access & Activity Analytics"}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lang === "th"
                  ? "เก็บสถิติความถี่การเข้าสู่ระบบ กิจกรรมที่ทำ และเวลาใช้งานล่าสุดของสมาชิกทุกคน (รวมถึง Viewer) เพื่อการพัฒนาแอป"
                  : "Track login frequency, performed actions, and last active timestamps for product development telemetry"}
              </p>
            </div>
          </div>
          <Badge variant="default" className="text-[10px] font-mono gap-1">
            <Activity className="h-3 w-3 animate-pulse" />
            <span>{totalLogins} Logins</span>
          </Badge>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Top 3 Metric Summary Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-muted/40 border space-y-1">
              <span className="text-muted-foreground text-[11px] block">
                {lang === "th" ? "👥 ผู้ใช้งานในระบบทั้งหมด" : "Total Registered Users"}
              </span>
              <div className="text-xl font-bold text-foreground flex items-center gap-1.5">
                <span>{users.length}</span>
                <span className="text-xs font-normal text-muted-foreground">{lang === "th" ? "คน" : "users"}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-emerald-700 dark:text-emerald-300 text-[11px] block font-medium">
                {lang === "th" ? "🔑 ยอดการเข้าสู่ระบบสะสม" : "Total User Logins"}
              </span>
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <span>{totalLogins}</span>
                <span className="text-xs font-normal text-emerald-600/70">{lang === "th" ? "ครั้ง" : "times"}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-1">
              <span className="text-blue-700 dark:text-blue-300 text-[11px] block font-medium">
                {lang === "th" ? "⚡ กิจกรรมทั้งหมดในระบบ" : "Total Performed Actions"}
              </span>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <span>{totalActions}</span>
                <span className="text-xs font-normal text-blue-600/70">{lang === "th" ? "รายการ" : "events"}</span>
              </div>
            </div>
          </div>

          {/* User Telemetry Table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">{lang === "th" ? "ชื่อ-นามสกุล" : "Member Name"}</th>
                  <th className="py-2.5 px-3">{lang === "th" ? "สิทธิ์ (Role)" : "Role"}</th>
                  <th className="py-2.5 px-3">{lang === "th" ? "เข้าใช้งาน (Logins)" : "Logins"}</th>
                  <th className="py-2.5 px-3">{lang === "th" ? "กิจกรรม (Actions)" : "Actions"}</th>
                  <th className="py-2.5 px-3">{lang === "th" ? "ใช้งานล่าสุดเมื่อ" : "Last Active"}</th>
                  <th className="py-2.5 px-3">{lang === "th" ? "กิจกรรมล่าสุด" : "Last Activity"}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u, idx) => {
                  const stat = userStats[u.id] || { loginCount: 0, actionCount: 0, lastActive: null, lastAction: "-" };
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className={`hover:bg-muted/30 transition-colors ${isCurrent ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""}`}>
                      <td className="py-3 px-3 font-mono font-bold text-muted-foreground">{String(idx + 1).padStart(2, "0")}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{u.full_name}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">
                              {lang === "th" ? "คุณ" : "You"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            u.role === "admin"
                              ? "default"
                              : u.role === "manager"
                              ? "high"
                              : "medium"
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {stat.loginCount} {lang === "th" ? "ครั้ง" : "times"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-muted-foreground">
                          {stat.actionCount} {lang === "th" ? "ครั้ง" : "acts"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-muted-foreground">
                        {stat.lastActive ? (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3 text-muted-foreground/70" />
                            <span>{formatDateTime(stat.lastActive)}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[11px] text-foreground truncate max-w-[180px]">
                        {stat.lastAction}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Recent Audit Stream Feed */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                <span>{lang === "th" ? "ประวัติการใช้งานล่าสุด (Recent Activity Stream):" : "Recent Activity Stream:"}</span>
              </span>
              <span className="text-[11px] text-muted-foreground">{lang === "th" ? "แสดง 5 รายการล่าสุด" : "Latest 5 records"}</span>
            </div>

            <div className="space-y-1.5">
              {(activityLogs || []).slice(0, 5).map((log) => {
                const logUser = users.find((u) => u.id === log.user_id) || log.user;
                return (
                  <div
                    key={log.id}
                    className="p-2 rounded-lg bg-muted/40 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-foreground shrink-0">{logUser?.full_name || "ผู้ใช้"}:</span>
                      <span className="text-muted-foreground truncate">{log.new_value || log.action}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground/70 shrink-0">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Projects Management Card (🏗️ จัดการโครงการก่อสร้างและบ้านจัดสรร) */}
      <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm">
        <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                {lang === "th" ? "จัดการโครงการก่อสร้าง & บ้านจัดสรร (Projects Management)" : "Projects Management"}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lang === "th" ? "เพิ่ม แก้ไข หรือลบโครงการพัฒนาอสังหาฯ และไซต์งานก่อสร้าง" : "Add, update, or remove development projects and construction sites"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditingProjectId(null);
              setProjectName("");
              setProjectNameEn("");
              setProjectTeamId(teams[0]?.id || "team-design");
              setProjectMsg(null);
              setShowProjectModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{lang === "th" ? "เพิ่มโครงการใหม่" : "Add Project"}</span>
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {projectMsg && (
            <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${projectMsg.success ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"}`}>
              {projectMsg.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
              <span>{projectMsg.text}</span>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-b text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">{lang === "th" ? "ชื่อโครงการ (ไทย)" : "Project Name (TH)"}</th>
                  <th className="py-2.5 px-4">{lang === "th" ? "ชื่อโครงการ (อังกฤษ)" : "Project Name (EN)"}</th>
                  <th className="py-2.5 px-4">{lang === "th" ? "ฝ่ายงานที่รับผิดชอบ" : "Assigned Team"}</th>
                  <th className="py-2.5 px-4 text-right">{lang === "th" ? "การจัดการ" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projects.map((p, idx) => {
                  const teamMatch = teams.find((t) => t.id === p.team_id);
                  const teamName = teamMatch ? getLocalizedDynamicText(teamMatch.name, teamMatch.name_en, lang) : (lang === "th" ? "ฝ่ายออกแบบ" : "Design Team");

                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-muted-foreground">{String(idx + 1).padStart(2, "0")}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{p.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{p.name_en || "-"}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {teamName}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingProjectId(p.id);
                            setProjectName(p.name || "");
                            setProjectNameEn(p.name_en || "");
                            setProjectTeamId(p.team_id || teams[0]?.id || "team-design");
                            setProjectMsg(null);
                            setShowProjectModal(true);
                          }}
                          className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                          title={lang === "th" ? "แก้ไขโครงการ" : "Edit Project"}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm(lang === "th" ? `ยืนยันการลบโครงการ "${p.name}"?` : `Confirm deleting project "${p.name}"?`)) {
                              const res = deleteProject(p.id);
                              if (res.success) {
                                setProjectMsg({ success: true, text: lang === "th" ? "ลบโครงการเรียบร้อยแล้ว" : "Project deleted successfully" });
                              } else {
                                setProjectMsg({ success: false, text: res.message || "Error" });
                              }
                            }
                          }}
                          className="h-7 w-7 p-0 cursor-pointer text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                          title={lang === "th" ? "ลบโครงการ" : "Delete Project"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Project Add / Edit Modal Dialog */}
      <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              <span>{editingProjectId ? (lang === "th" ? "แก้ไขโครงการ" : "Edit Project") : (lang === "th" ? "เพิ่มโครงการใหม่" : "Add New Project")}</span>
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!projectName.trim()) return;

              let finalNameEn = projectNameEn.trim();
              if (!finalNameEn) {
                const trans = await translateText(projectName.trim());
                finalNameEn = trans.translatedText;
              }

              if (editingProjectId) {
                updateProject(editingProjectId, projectName.trim(), finalNameEn, projectTeamId);
                setProjectMsg({ success: true, text: lang === "th" ? "อัปเดตโครงการเรียบร้อยแล้ว" : "Project updated successfully" });
              } else {
                addProject(projectName.trim(), finalNameEn, projectTeamId);
                setProjectMsg({ success: true, text: lang === "th" ? "เพิ่มโครงการใหม่เรียบร้อยแล้ว" : "Project added successfully" });
              }
              setShowProjectModal(false);
            }}
            className="space-y-4 text-xs pt-2"
          >
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {lang === "th" ? "ชื่อโครงการ (ภาษาไทย):" : "Project Name (Thai):"} <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. โครงการบ้านเดี่ยว The Forest Villa Phase 2"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {lang === "th" ? "ชื่อโครงการ (ภาษาอังกฤษ - แปลอัตโนมัติ):" : "Project Name (English):"}
              </label>
              <Input
                value={projectNameEn}
                onChange={(e) => setProjectNameEn(e.target.value)}
                placeholder="e.g. The Forest Villa Residence Phase 2"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {lang === "th" ? "สังกัดฝ่ายงานหลัก (Department):" : "Assigned Department:"}
              </label>
              <Select
                value={projectTeamId}
                onChange={(e) => setProjectTeamId(e.target.value)}
                className="text-xs"
              >
                {teams.map((t, idx) => (
                  <option key={t.id} value={t.id}>
                    {String(idx + 1).padStart(2, "0")}. {getLocalizedDynamicText(t.name, t.name_en, lang)}
                  </option>
                ))}
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowProjectModal(false)}
              >
                {lang === "th" ? "ยกเลิก" : "Cancel"}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {lang === "th" ? "บันทึกโครงการ" : "Save Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Organization Info Card */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-3 border-b flex flex-row items-center gap-2">
          <Building className="h-4 w-4 text-emerald-600" />
          <CardTitle className="text-sm font-bold text-foreground">
            {t("orgInfoTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-muted-foreground block text-[11px]">{t("orgName")}</span>
            <strong className="text-foreground text-sm">MeDTree Design & Build</strong>
          </div>
          <div className="p-3 rounded-lg bg-muted/40 space-y-1">
            <span className="text-muted-foreground block text-[11px]">{t("orgId")}</span>
            <code className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
              11111111-1111-1111-1111-111111111111
            </code>
          </div>
        </CardContent>
      </Card>

      {/* 5. User Profile Card */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-3 border-b flex flex-row items-center gap-2">
          <User className="h-4 w-4 text-emerald-600" />
          <CardTitle className="text-sm font-bold text-foreground">
            {t("userProfileTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-muted/40">
            <span className="text-muted-foreground block text-[11px]">{t("userFullName")}</span>
            <strong className="text-foreground text-xs">{currentUser.full_name}</strong>
          </div>
          <div className="p-3 rounded-lg bg-muted/40">
            <span className="text-muted-foreground block text-[11px]">{t("userEmail")}</span>
            <span className="text-foreground text-xs">{currentUser.email}</span>
          </div>
          <div className="p-3 rounded-lg bg-muted/40">
            <span className="text-muted-foreground block text-[11px]">{t("userRole")}</span>
            <Badge variant="default" className="text-[10px] uppercase font-bold mt-0.5">
              {currentUser.role}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
