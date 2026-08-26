"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTaskStore } from "@/lib/store/task-store";
import { useLanguage } from "@/lib/i18n/language-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Layers, ShieldCheck, UserCheck, ArrowRight, Sparkles } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default function LoginPage() {
  const router = useRouter();
  const { users, setCurrentUser } = useTaskStore();
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleQuickLogin = (user: (typeof users)[0]) => {
    setCurrentUser(user);
    router.push("/dashboard");
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setCurrentUser(found);
      router.push("/dashboard");
    } else {
      alert(lang === "th" ? "ไม่พบบัญชีผู้ใช้นี้ในระบบ (สามารถกด Demo Login ด้านล่างได้ทันที)" : "User account not found. Try Demo Login below.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative">
      {/* Top right language toggle */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-600/30">
            <Layers className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t("appName")}</h1>
          <p className="text-xs text-muted-foreground">{t("appSubtitle")} ({t("phase1Badge")})</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-border">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base font-bold">
              {lang === "th" ? "เข้าสู่ระบบ (Sign In)" : "Sign In to TaskFlow"}
            </CardTitle>
            <CardDescription className="text-xs">
              {lang === "th" ? "กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน" : "Enter your email and password to access your dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleManualLogin} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">{t("userEmail")}</label>
                <Input
                  type="email"
                  required
                  placeholder="admin@medtree.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">{lang === "th" ? "รหัสผ่าน" : "Password"}</label>
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
              >
                {lang === "th" ? "เข้าสู่ระบบ" : "Sign In"}
              </Button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>{lang === "th" ? "ทดสอบด่วนตาม Role (Demo Quick Login):" : "Quick Demo Login by Role:"}</span>
              </div>

              <div className="space-y-2">
                {users.map((u) => (
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
