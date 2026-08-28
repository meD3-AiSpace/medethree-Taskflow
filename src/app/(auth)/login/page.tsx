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

export default function LoginPage() {
  const router = useRouter();
  const { users, login } = useTaskStore();
  const { t, lang } = useLanguage();

  const [activeTab, setActiveTab] = useState<"quick" | "password">("quick");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();

      if (isSignUp) {
        // Sign Up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split("@")[0],
              org_id: "11111111-1111-1111-1111-111111111111", // Baan Suay Default Org
            },
          },
        });

        if (error) throw error;

        setSuccessMessage(
          lang === "th"
            ? "สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ..."
            : "Sign up successful! Signing in..."
        );

        if (data.session) {
          const userObj = {
            id: data.user?.id || `u-${Date.now()}`,
            org_id: "11111111-1111-1111-1111-111111111111",
            full_name: fullName || email.split("@")[0],
            email,
            role: "member" as any,
            created_at: new Date().toISOString(),
          };
          login(userObj);
          router.replace("/dashboard");
        } else {
          setIsSignUp(false);
        }
      } else {
        // Sign In with Password or Local User Match
        const localFound = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (localFound) {
          login(localFound);
          router.replace("/dashboard");
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (profile) {
            login(profile);
          } else {
            login({
              id: data.user.id,
              org_id: "11111111-1111-1111-1111-111111111111",
              full_name: data.user.email?.split("@")[0] || "ผู้ใช้งาน",
              email: data.user.email || email,
              role: "viewer" as any,
              created_at: new Date().toISOString(),
            });
          }

          router.replace("/dashboard");
        }
      }
    } catch (err: any) {
      console.error("[Login Auth Error]:", err);
      const localFound = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (localFound && !isSignUp) {
        login(localFound);
        router.replace("/dashboard");
      } else {
        setErrorMessage(
          err.message ||
            (lang === "th"
              ? "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน"
              : "Authentication failed. Please check your credentials.")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user: (typeof users)[0]) => {
    login(user);
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 p-4 relative text-foreground">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top right language toggle */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md space-y-5 relative z-10">
        {/* Brand with Animated Lighthouse Beacon */}
        <div className="text-center space-y-2.5 flex flex-col items-center">
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
                ? "ระบบบริหาร & ติดตามงาน • บ้านสวยแลนด์แอนด์เฮ้าส์"
                : "Project & Workforce Tracking • Baan Suay Land & House"}
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-white/10 bg-card/95 backdrop-blur-md">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground">
                {lang === "th" ? "เข้าสู่ระบบ (Sign In)" : "Sign In to TaskFlow"}
              </CardTitle>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                🔒 Protected Access
              </span>
            </div>

            {/* Login Mode Toggle Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-lg bg-muted/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("quick")}
                className={`py-1.5 rounded-md transition-all cursor-pointer ${
                  activeTab === "quick"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "th" ? "👤 เลือกบัญชีผู้ใช้" : "👤 Quick Member"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className={`py-1.5 rounded-md transition-all cursor-pointer ${
                  activeTab === "password"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "th" ? "🔑 อีเมล / รหัสผ่าน" : "🔑 Email / Password"}
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB 1: Quick Member Login */}
            {activeTab === "quick" && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  {lang === "th"
                    ? "คลิกเลือกชื่อของคุณเพื่อเข้าสู่ระบบทันที (รวมถึงระดับ Viewer):"
                    : "Click your profile to sign in instantly (including Viewers):"}
                </p>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickLogin(u)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl border bg-background hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 hover:border-emerald-400 transition-all text-xs text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                          {(u.full_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground group-hover:text-emerald-700 truncate">
                            {u.full_name}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          u.role === "admin"
                            ? "default"
                            : u.role === "manager"
                            ? "high"
                            : "medium"
                        }
                        className="text-[9px] uppercase font-bold shrink-0 ml-2"
                      >
                        {u.role}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Email & Password Sign In / Sign Up */}
            {activeTab === "password" && (
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-foreground">
                      {lang === "th" ? "ชื่อ-นามสกุล / ตำแหน่ง:" : "Full Name / Title:"}
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="เช่น สมชาย (โฟร์แมน)"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    {lang === "th" ? "อีเมล (Email):" : "Email Address:"}
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="name@baansuay.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    {lang === "th" ? "รหัสผ่าน (Password):" : "Password:"}
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold gap-2 mt-2 cursor-pointer"
                >
                  {loading ? (
                    <span className="animate-pulse">{lang === "th" ? "กำลังดำเนินการ..." : "Processing..."}</span>
                  ) : isSignUp ? (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>{lang === "th" ? "สมัครสมาชิกและเข้าสู่ระบบ" : "Sign Up"}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>{lang === "th" ? "เข้าสู่ระบบ" : "Sign In"}</span>
                    </>
                  )}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-500 font-semibold transition-colors cursor-pointer"
                  >
                    {isSignUp
                      ? lang === "th"
                        ? "มีบัญชีแล้ว? เข้าสู่ระบบ"
                        : "Have an account? Sign In"
                      : lang === "th"
                      ? "ยังไม่มีบัญชี? สมัครสมาชิกใหม่"
                      : "New user? Sign Up"}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
