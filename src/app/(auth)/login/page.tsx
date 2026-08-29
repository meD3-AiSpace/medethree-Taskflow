"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, LogIn, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LighthouseLogo } from "@/components/ui/lighthouse-logo";
import { createClient } from "@/lib/supabase/client";
import { getLocalizedDynamicText } from "@/lib/i18n/dynamic-translator";

export default function LoginPage() {
  const router = useRouter();
  const { users, login } = useTaskStore();
  const { t, lang } = useLanguage();

  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPilotGuide, setShowPilotGuide] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Strict Whitelist Check: Must match users registered in Settings database by Admin
    let availableUsers = users;
    try {
      const savedUsersStr = localStorage.getItem("taskflow_users");
      if (savedUsersStr) {
        const parsed = JSON.parse(savedUsersStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          availableUsers = parsed;
        }
      }
    } catch {}

    const preRegisteredUser = availableUsers.find(
      (u) => u.email.trim().toLowerCase() === cleanEmail
    );

    if (!preRegisteredUser) {
      setLoading(false);
      setErrorMessage(
        lang === "th"
          ? `🚫 ไม่พบอีเมล "${email}" ในฐานข้อมูลองค์กร: บัญชีผู้ใช้ต้องได้รับการเพิ่มชื่อและกำหนดสิทธิ์โดย Admin ในหน้า Settings ก่อนเข้าใช้งาน กรุณาติดต่อ Admin หรือฝ่ายบุคคล`
          : `🚫 Email "${email}" is not registered in the organization database. Please contact your Admin to assign role & access permissions.`
      );
      return;
    }

    if (!password || password.length < 6) {
      setLoading(false);
      setErrorMessage(
        lang === "th"
          ? "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร"
          : "Password must be at least 6 characters"
      );
      return;
    }

    try {
      const supabase = createClient();

      if (isSignUp) {
        // Sign Up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: preRegisteredUser.full_name,
              org_id: preRegisteredUser.org_id || "11111111-1111-1111-1111-111111111111",
            },
          },
        });

        if (error) {
          setErrorMessage(
            lang === "th"
              ? `ไม่สามารถลงทะเบียนได้: ${error.message}`
              : `Sign up failed: ${error.message}`
          );
          setLoading(false);
          return;
        }

        setSuccessMessage(
          lang === "th"
            ? `ยินดีต้อนรับคุณ ${preRegisteredUser.full_name}! กำลังเข้าสู่ระบบ...`
            : `Welcome ${preRegisteredUser.full_name}! Signing in...`
        );

        setTimeout(() => {
          login(preRegisteredUser);
          router.replace("/dashboard");
        }, 600);
      } else {
        // Sign In with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          const isInvalidCreds = error.message.toLowerCase().includes("invalid login credentials");
          setErrorMessage(
            isInvalidCreds
              ? lang === "th"
                ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง (หากยังไม่เคยตั้งรหัสผ่าน กรุณากด 'เปิดสิทธิ์ครั้งแรก (Sign Up)')"
                : "Invalid email or password. If you haven't created a password yet, please click 'First time sign in? Sign Up'."
              : lang === "th"
              ? `เข้าสู่ระบบไม่สำเร็จ: ${error.message}`
              : `Sign in failed: ${error.message}`
          );
          setLoading(false);
          return;
        }

        setSuccessMessage(
          lang === "th"
            ? `ยินดีต้อนรับคุณ ${preRegisteredUser.full_name} (${preRegisteredUser.role.toUpperCase()})`
            : `Welcome back, ${preRegisteredUser.full_name}!`
        );

        setTimeout(() => {
          login(preRegisteredUser);
          router.replace("/dashboard");
        }, 500);
      }
    } catch (err: any) {
      console.error("[Login Auth Error]:", err);
      setErrorMessage(
        lang === "th"
          ? `เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์: ${err.message || "กรุณาลองใหม่อีกครั้ง"}`
          : `Authentication error: ${err.message || "Please try again"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 p-4 relative text-foreground">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top right language toggle */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md space-y-4 relative z-10">
        {/* Brand with Animated Lighthouse Beacon */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <LighthouseLogo size="xl" showText={false} animateBeam={true} />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>Lighthouse</span>
              <span className="text-sm font-bold text-amber-400 border border-amber-400/40 px-2 py-0.5 rounded-full bg-amber-400/10">
                TaskFlow
              </span>
            </h1>
            <p className="text-xs text-amber-200/90 font-medium mt-1">
              {lang === "th"
                ? "ระบบบริหาร & ติดตามงาน • บริษัทบ้านสวยแลนด์แอนด์เฮ้าส์"
                : "Project & Workforce Tracking • Baan Suay Land & House"}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-white/10 bg-card/95 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground">
                {isSignUp
                  ? lang === "th"
                    ? "ลงทะเบียนเปิดสิทธิ์ผู้ใช้งาน (Sign Up)"
                    : "Register Access"
                  : lang === "th"
                  ? "เข้าสู่ระบบ (Sign In)"
                  : "Sign In to TaskFlow"}
              </CardTitle>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                🔒 {lang === "th" ? "เฉพาะอีเมลที่ Admin อนุมัติ" : "Whitelisted Only"}
              </span>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              {isSignUp
                ? lang === "th"
                  ? "กรอกอีเมลที่ Admin ระบุไว้ในระบบ เพื่อตั้งรหัสผ่านเข้าใช้งาน"
                  : "Enter the email registered by Admin in Settings to create access"
                : lang === "th"
                ? "กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งานระบบองค์กร"
                : "Enter your company email and password to access the portal"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {/* Email & Password Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">
                  {lang === "th" ? "อีเมลพนักงาน/สมาชิก (Work Email):" : "Work Email:"} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="email"
                  required
                  placeholder="name@baansuay.com หรือ user@medtree.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-foreground">
                  {lang === "th" ? "รหัสผ่าน (Password):" : "Password:"} <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold gap-2 mt-2 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <span className="animate-pulse">{lang === "th" ? "กำลังตรวจสอบฐานข้อมูล..." : "Verifying with database..."}</span>
                ) : isSignUp ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>{lang === "th" ? "ยืนยันอีเมลและเข้าสู่ระบบ" : "Verify & Sign Up"}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>{lang === "th" ? "เข้าสู่ระบบ (Sign In)" : "Sign In"}</span>
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors cursor-pointer"
                >
                  {isSignUp
                    ? lang === "th"
                      ? "มีบัญชีแล้ว? เข้าสู่ระบบ"
                      : "Have an account? Sign In"
                    : lang === "th"
                    ? "เปิดสิทธิ์ครั้งแรก (Sign Up)"
                    : "First time sign in? Sign Up"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPilotGuide(!showPilotGuide)}
                  className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>{showPilotGuide ? (lang === "th" ? "▲ ปิดรายชื่อ" : "▲ Close") : (lang === "th" ? "💡 ดูอีเมลในระบบ" : "💡 Registered Emails")}</span>
                </button>
              </div>

              {/* Collapsible Whitelist Viewer for Pilot Testing */}
              {showPilotGuide && (
                <div className="p-3 rounded-xl bg-muted/50 border text-[11px] space-y-2 animate-in fade-in">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>{lang === "th" ? "📋 รายชื่ออีเมลที่ระบุไว้ใน Settings:" : "📋 Whitelisted in Settings:"}</span>
                    <span className="text-[10px] text-muted-foreground">{users.length} คน</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 pr-1 divide-y divide-border/50">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setEmail(u.email);
                          setPassword("123456");
                        }}
                        className="pt-1 first:pt-0 flex items-center justify-between hover:text-emerald-600 cursor-pointer group"
                        title={lang === "th" ? "คลิกเพื่อกรอกอีเมลนี้อัตโนมัติ" : "Click to auto-fill"}
                      >
                        <div className="truncate">
                          <span className="font-medium text-foreground group-hover:text-emerald-600">{getLocalizedDynamicText(u.full_name, null, lang)}</span>
                          <span className="text-[10px] text-muted-foreground block truncate">{u.email}</span>
                        </div>
                        <Badge
                          variant={
                            u.role === "admin"
                              ? "default"
                              : u.role === "manager"
                              ? "high"
                              : "medium"
                          }
                          className="text-[8px] uppercase font-bold shrink-0 ml-1"
                        >
                          {u.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
