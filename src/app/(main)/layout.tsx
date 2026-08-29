"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isAuthInitialized && !currentUser) {
      router.replace("/login");
    }
  }, [isAuthInitialized, currentUser, router]);

  const handleScroll = () => {
    if (mainRef.current) {
      setShowScrollTop(mainRef.current.scrollTop > 180);
    }
  };

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden relative">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-6 md:p-8 pb-28 sm:pb-24 md:pb-12 bg-muted/20 smooth-scroll"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">{children}</div>
        </main>

        {/* Mobile Bottom Navigation Bar (Smartphones & Small Screens) */}
        <MobileNav />

        {/* Floating Quick Scroll-to-Top Button for Mobile, Tablet & Desktop */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            title="เลื่อนกลับขึ้นด้านบน (Scroll to Top)"
            className="fixed bottom-16 md:bottom-6 right-4 md:right-6 z-40 p-3 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/40 backdrop-blur-sm transition-all animate-in fade-in zoom-in duration-200 cursor-pointer flex items-center justify-center group"
          >
            <ArrowUp className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}

