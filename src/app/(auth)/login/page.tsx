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
  const { users, setCurrentUser } = useTaskStore();
  const { t, lang } = useLanguage();
  
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
              org_id: "11111111-1111-1111-1111-111111111111", // MeDTree Default Org
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
          router.push("/dashboard");
        } else {
          setIsSignUp(false);
        }
      } else {
        // Sign In with Password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Fetch user profile from database
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (profile) {
            setCurrentUser(profile);
          }

          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      console.error("[Login Auth Error]:", err);
      // Fallback for local dev if Supabase connection fails or invalid credentials
      const localFound = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (localFound && !isSignUp) {
        setCurrentUser(localFound);
        router.push("/dashboard");
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
    setCurrentUser(user);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 p-4 relative text-foreground">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top right language toggle */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand with Animated Lighthouse Beacon */}
        <div className="text-center space-y-3 flex flex-col items-center">
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
                ? "ประภาคารนำทางความสำเร็จในการบริหารบุคลากร & โครงการ"
                : "Guiding Beacon for People & Project Management"}
            </p>
          </div>

          {/* Philosophy Card */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-[11px] text-slate-300 leading-relaxed text-center shadow-lg">
            <p className="italic">&ldquo;{t("appPhilosophy")}&rdquo;</p>
          </div>
        </div>

        {/* Login / Sign Up Card */}
        <Card className="shadow-2xl border-white/10 bg-card/95 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground">
                {isSignUp
                  ? lang === "th"
                    ? "สร้างบัญชีผู้ใช้ใหม่ (Sign Up)"
                    : "Create New Account"
                  : lang === "th"
                  ? "เข้าสู่ระบบ (Sign In)"
                  : "Sign In to Lighthouse"}
              </CardTitle>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-xs text-emerald-600 hover:text-emerald-500 font-semibold transition-colors"
              >
                {isSignUp
                  ? lang === "th"
                    ? "มีบัญชีแล้ว? เข้าสู่ระบบ"
                    : "Have an account? Sign In"
                  : lang === "th"
                  ? "สมัครสมาชิกใหม่"
                  : "Sign Up"}
              </button>
            </div>
            <CardDescription className="text-xs">
              {isSignUp
                ? lang === "th"
                  ? "กรอกข้อมูลเพื่อลงทะเบียนเข้าสู่ระบบองค์กร"
                  : "Register with your work email and password"
                : lang === "th"
                ? "กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน"
                : "Enter your credentials or choose a quick demo role"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              {isSignUp && (
                <div>
                  <label className="block font-semibold mb-1">
                    {lang === "th" ? "ชื่อ-นามสกุล" : "Full Name"}
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="สมชาย สถาปนิก"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">{t("userEmail")}</label>
                <Input
                  type="email"
                  required
                  placeholder="architect@medtree.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  {lang === "th" ? "รหัสผ่าน" : "Password"}
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold gap-2"
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
            </form>

            {/* Quick Demo Switcher */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>{lang === "th" ? "ทดสอบด่วนตาม Role (Demo Quick Login):" : "Quick Demo Login by Role:"}</span>
              </div>

              <div className="space-y-2">
                {users.slice(0, 3).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border bg-background hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 transition-all text-xs text-left group"
                  >
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-emerald-700">
                        {u.full_name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{u.email}</div>
                    </div>
                    <Badge variant={u.role === "admin" ? "default" : u.role === "manager" ? "high" : "medium"} className="text-[10px] uppercase">
                      {u.role}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
