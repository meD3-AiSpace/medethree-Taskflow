"use client";

import React, { useState, useEffect } from "react";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Send,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Shield,
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
} from "lucide-react";
import { translateText } from "@/lib/i18n/auto-translate";

const DEFAULT_LINE_ACCESS_TOKEN =
  "8OBUXdfTk10sKwL/o1KvCTbx0C4TbUA/q+q2/Fb9jniS8AQCKmO/jUvxioGUflsM2iLIDricYT5Qt7H8EfjrUbiLncPUXbueDD0rjnjGu8xuiJ01r0w55V0SBHdaogsMTivcHwHxw71UmjhXjFIVHAdB04t89/1O/w1cDnyilFU=";
const DEFAULT_LINE_USER_ID = "Ud03173af920035ad7d808a0feb10327d";

export default function SettingsPage() {
  const {
    currentUser,
    updateLineUserId,
    updateNotificationPreferences,
    geminiApiKey,
    setGeminiApiKey,
  } = useTaskStore();
  const { t, lang } = useLanguage();

  const [lineUserId, setLineUserId] = useState(currentUser.line_user_id || DEFAULT_LINE_USER_ID);
  const [channelAccessToken, setChannelAccessToken] = useState(DEFAULT_LINE_ACCESS_TOKEN);
  const [geminiKeyInput, setGeminiKeyInput] = useState(geminiApiKey || "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveKeySuccess, setSaveKeySuccess] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string; raw?: any } | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Phase 2: Notification Preferences State (Question 4: Choice ค)
  const [prefs, setPrefs] = useState({
    notify_assignment: currentUser.notification_preferences?.notify_assignment ?? true,
    notify_blocker: currentUser.notification_preferences?.notify_blocker ?? true,
    notify_review: currentUser.notification_preferences?.notify_review ?? true,
    notify_deadline: currentUser.notification_preferences?.notify_deadline ?? true,
    notify_line: currentUser.notification_preferences?.notify_line ?? true,
  });
  const [savePrefsSuccess, setSavePrefsSuccess] = useState(false);

  const handleSavePrefs = (e: React.FormEvent) => {
    e.preventDefault();
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
      const savedToken =
        localStorage.getItem("taskflow_line_channel_access_token") || DEFAULT_LINE_ACCESS_TOKEN;
      setChannelAccessToken(savedToken);
      localStorage.setItem("taskflow_line_channel_access_token", savedToken);

      const savedLineUserId =
        currentUser.line_user_id ||
        localStorage.getItem("taskflow_line_user_id") ||
        DEFAULT_LINE_USER_ID;
      setLineUserId(savedLineUserId);
      localStorage.setItem("taskflow_line_user_id", savedLineUserId);

      if (geminiApiKey) setGeminiKeyInput(geminiApiKey);
    } catch {}
  }, [currentUser, geminiApiKey]);

  const handleSaveLineConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUserId = lineUserId.trim() || DEFAULT_LINE_USER_ID;
    const finalToken = channelAccessToken.trim() || DEFAULT_LINE_ACCESS_TOKEN;

    updateLineUserId(currentUser.id, finalUserId);
    setLineUserId(finalUserId);
    setChannelAccessToken(finalToken);

    try {
      localStorage.setItem("taskflow_line_user_id", finalUserId);
      localStorage.setItem("taskflow_line_channel_access_token", finalToken);
    } catch {}

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(geminiKeyInput.trim());
    setSaveKeySuccess(true);
    setTimeout(() => setSaveKeySuccess(false), 3500);
  };

  const handleTestTranslation = async () => {
    setIsTestingTranslate(true);
    const res = await translateText(testInputText, geminiKeyInput.trim());
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
          channelAccessToken: channelAccessToken.trim(),
          title: lang === "th" ? "ทดสอบการแจ้งเตือนจากระบบ TaskFlow" : "TaskFlow Push Notification Test",
          message: lang === "th"
            ? `สวัสดีคุณ ${currentUser.full_name}! ระบบ TaskFlow Manager เชื่อมต่อกับ LINE OA ของคุณสำเร็จเรียบร้อยแล้ว`
            : `Hello ${currentUser.full_name}! TaskFlow Manager is successfully connected with your LINE OA`,
          taskTitle: lang === "th" ? "ทดสอบส่งแจ้งเตือนระบบติดตามงาน" : "TaskFlow Integration Verification",
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

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("settingsTitle")}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{t("settingsSub")}</p>
      </div>

      {/* 1. Gemini AI Translation Key Card */}
      <Card className="border-purple-200 dark:border-purple-900 shadow-sm bg-gradient-to-b from-purple-50/20 to-transparent">
        <CardHeader className="p-4 pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-sm font-bold text-foreground">
              {lang === "th" ? "ตั้งค่า Gemini AI Translation API Key (ระบบแปลภาษาอัตโนมัติ)" : "Gemini AI Translation API Key Settings"}
            </CardTitle>
          </div>
          <Badge variant={geminiKeyInput ? "success" : "default"}>
            {geminiKeyInput ? (lang === "th" ? "ตั้งค่า API Key แล้ว" : "Custom Key Active") : (lang === "th" ? "ใช้ Default Built-in" : "Built-in Active")}
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

          <form onSubmit={handleSaveGeminiKey} className="space-y-3">
            <div>
              <label className="block font-semibold mb-1 text-foreground flex items-center justify-between">
                <span>Google Gemini API Key:</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 dark:text-emerald-400 underline font-normal flex items-center gap-0.5 text-[11px]"
                >
                  {lang === "th" ? "รับ Gemini API Key ฟรีจาก Google AI Studio" : "Get Free Gemini Key"} <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="text-xs font-mono"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                >
                  {lang === "th" ? "บันทึก API Key" : "Save Key"}
                </Button>
              </div>
            </div>

            {saveKeySuccess && (
              <span className="flex items-center gap-1 text-purple-600 font-semibold text-xs animate-in fade-in">
                <CheckCircle2 className="h-4 w-4" />
                {lang === "th" ? "บันทึก Gemini API Key เรียบร้อยแล้ว!" : "Gemini API Key saved!"}
              </span>
            )}
          </form>

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
          <Badge variant={lineUserId ? "success" : "destructive"}>
            {lineUserId ? (lang === "th" ? "ระบุ LINE ID แล้ว" : "LINE ID Set") : (lang === "th" ? "ยังไม่ได้ระบุ" : "Not Set")}
          </Badge>
        </CardHeader>

        <CardContent className="p-5 space-y-5 text-xs">
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
                  rel="noreferrer"
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

            {/* Field 2: Channel Access Token */}
            <div>
              <label className="block font-semibold mb-1 text-foreground flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-emerald-600" />
                <span>{t("fieldChannelToken")}</span>
              </label>
              <Input
                type="password"
                value={channelAccessToken}
                onChange={(e) => setChannelAccessToken(e.target.value)}
                placeholder={lang === "th" ? "วาง Channel Access Token จาก LINE Developers Console..." : "Paste Channel Access Token from LINE Developers Console..."}
                className="text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>{lang === "th" ? "บันทึกการตั้งค่า" : "Save Preferences"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Organization Info Card */}
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

      {/* 4. User Profile Card */}
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
