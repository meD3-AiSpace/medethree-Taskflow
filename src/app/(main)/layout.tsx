"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useTaskStore } from "@/lib/store/task-store";
import { LighthouseLogo } from "@/components/ui/lighthouse-logo";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser, isAuthInitialized } = useTaskStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthInitialized && !currentUser) {
      router.replace("/login");
    }
  }, [isAuthInitialized, currentUser, router]);

  // Loading state while verifying user session
  if (!isAuthInitialized || !currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <LighthouseLogo size="lg" showText={false} animateBeam={true} />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-emerald-600 animate-pulse">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
          <p className="text-xs text-muted-foreground">Lighthouse TaskFlow • MeDTree System</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Responsive Sidebar (Static on Desktop, Drawer on Mobile) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-muted/20 overscroll-contain touch-pan-y smooth-scroll">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

