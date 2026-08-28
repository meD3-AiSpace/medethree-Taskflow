"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Download, Share, PlusSquare, Smartphone, Monitor, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n/language-context";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Global hook to capture beforeinstallprompt at the earliest lifecycle
declare global {
  interface Window {
    deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    window.deferredPwaPrompt = e as BeforeInstallPromptEvent;
  });
}

export function InstallPWAButton({
  variant = "header",
  className = "",
}: {
  variant?: "header" | "sidebar" | "banner";
  className?: string;
}) {
  const { lang } = useLanguage();
  const [promptReady, setPromptReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    if (window.deferredPwaPrompt) {
      setPromptReady(true);
    }

    // Check iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.deferredPwaPrompt = e as BeforeInstallPromptEvent;
      setPromptReady(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.deferredPwaPrompt = null;
      setPromptReady(false);
      setShowGuideModal(false);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // 1-Click Direct Native Install Trigger
  const handleInstallClick = async () => {
    const activePrompt = window.deferredPwaPrompt;

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const choice = await activePrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
        }
        window.deferredPwaPrompt = null;
        setPromptReady(false);
        return;
      } catch (err) {
        console.warn("[PWA Direct Install Prompt Error]:", err);
      }
    }

    // Fallback: If on iOS or browser without prompt, display quick guidance
    setShowGuideModal(true);
  };

  // If already installed in standalone mode, display subtle installed indicator or hide
  if (isInstalled) {
    if (variant === "sidebar") {
      return (
        <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-500/20">
          <div className="relative h-4 w-4 shrink-0">
            <Image
              src="/images/baansuay-shield-logo.png"
              alt="Baansuay Logo"
              width={16}
              height={16}
              className="object-contain"
            />
          </div>
          <span className="font-medium truncate">
            {lang === "th" ? "แอปติดตั้งแล้ว ✓" : "App Installed ✓"}
          </span>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {variant === "header" && (
        <button
          type="button"
          onClick={handleInstallClick}
          title={lang === "th" ? "คลิกเพื่อติดตั้งแอป TaskFlow ลงบนอุปกรณ์ทันที" : "Click to install TaskFlow App directly"}
          className={"flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-400/50 bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-emerald-500/15 hover:from-amber-500/30 hover:to-emerald-500/30 text-foreground font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-[0.97] cursor-pointer group " + className}
        >
          <div className="relative h-4 w-4 shrink-0 drop-shadow-[0_0_5px_rgba(245,158,11,0.6)] group-hover:scale-115 transition-transform">
            <Image
              src="/images/baansuay-shield-logo.png"
              alt="Baansuay Shield Logo"
              width={16}
              height={16}
              className="object-contain"
              priority
            />
          </div>
          <span className="hidden sm:inline bg-gradient-to-r from-amber-900 via-amber-800 to-emerald-900 dark:from-amber-100 dark:via-amber-200 dark:to-emerald-200 bg-clip-text text-transparent font-black">
            {lang === "th" ? "ติดตั้งแอป" : "Install App"}
          </span>
          <Download className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}

      {variant === "sidebar" && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={"w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/15 hover:border-amber-500/70 hover:shadow-xs transition-all active:scale-[0.98] text-xs font-bold cursor-pointer group " + className}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-6 w-6 shrink-0 drop-shadow-[0_0_6px_rgba(245,158,11,0.7)] group-hover:scale-115 transition-transform">
              <Image
                src="/images/baansuay-shield-logo.png"
                alt="Baansuay Shield Logo"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div className="text-left truncate">
              <div className="text-foreground leading-tight font-bold">
                {lang === "th" ? "ติดตั้งแอปลงเครื่อง" : "Install App to Device"}
              </div>
              <div className="text-[10px] text-muted-foreground font-normal">
                {lang === "th" ? "คลิกติดตั้งลงเครื่องทันที" : "Direct 1-Click Native Install"}
              </div>
            </div>
          </div>
          <Download className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Guidance Modal for iOS Safari (Where Apple requires Share Sheet) or Browsers without direct API */}
      {showGuideModal && (
        <Dialog open={showGuideModal} onOpenChange={setShowGuideModal}>
          <DialogContent className="max-w-md" onClose={() => setShowGuideModal(false)}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]">
                  <Image
                    src="/images/baansuay-shield-logo.png"
                    alt="Baansuay Shield Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    {lang === "th" ? "ติดตั้งแอป Lighthouse TaskFlow" : "Install Lighthouse TaskFlow"}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    Baansuay Land & House • MeDTree System
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              {isIOS ? (
                /* iOS / Safari Step-by-Step Guide */
                <div className="space-y-3 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                  <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-amber-600" />
                    <span>{lang === "th" ? "วิธีติดตั้งบน iPhone / iPad (Safari):" : "How to Install on iPhone / iPad:"}</span>
                  </div>
                  <ol className="space-y-2.5 text-muted-foreground list-decimal list-inside pl-1 text-[11px] leading-relaxed">
                    <li>
                      {lang === "th" ? "แตะปุ่มแชร์ " : "Tap the Share button "}
                      <strong className="text-foreground inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-background border">
                        <Share className="h-3 w-3 text-blue-600 inline" /> Share
                      </strong>
                      {lang === "th" ? "ที่แถบเครื่องมือด้านล่าง/บนของ Safari" : "in the Safari browser bar"}
                    </li>
                    <li>
                      {lang === "th" ? "เลื่อนลงมาแล้วเลือก " : "Scroll down and select "}
                      <strong className="text-foreground inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-background border">
                        <PlusSquare className="h-3 w-3 text-emerald-600 inline" />
                        {lang === "th" ? "เพิ่มไปยังหน้าจอโฮม" : "Add to Home Screen"}
                      </strong>
                    </li>
                    <li>
                      {lang === "th" ? "แตะคำว่า " : "Tap "}
                      <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {lang === "th" ? "\"เพิ่ม (Add)\"" : "\"Add\""}
                      </strong>
                      {lang === "th" ? " ที่มุมขวาบนเพื่อเสร็จสิ้น" : " at the top right corner to complete"}
                    </li>
                  </ol>
                </div>
              ) : (
                /* Android / Desktop Browser Guide */
                <div className="space-y-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-emerald-600" />
                    <span>{lang === "th" ? "วิธีติดตั้งบน คอมพิวเตอร์ / Android:" : "How to Install on PC / Android:"}</span>
                  </div>
                  <ul className="space-y-2 text-muted-foreground text-[11px] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        {lang === "th"
                          ? "คลิกที่ไอคอน ติดตั้ง (Install App ⊕) บนแถบ Address Bar ของ Google Chrome หรือ Microsoft Edge"
                          : "Click the Install App (⊕) icon in the Chrome / Edge address bar."}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        {lang === "th"
                          ? "บนมือถือ Android: แตะปุ่มเมนู 3 จุด (⋮) ➔ เลือก \"ติดตั้งแอป\" หรือ \"เพิ่มลงในหน้าจอหลัก\""
                          : "On Android: Tap browser menu (⋮) ➔ select \"Install app\" or \"Add to Home screen\"."}
                      </span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => setShowGuideModal(false)}
                  className="text-xs cursor-pointer"
                >
                  {lang === "th" ? "เข้าใจแล้ว (ปิดหน้าต่าง)" : "Got It"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
