"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, Theme } from "@/lib/theme/theme-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: { value: Theme; labelTh: string; labelEn: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "system", labelTh: "💻 อัตโนมัติ (System)", labelEn: "💻 System", icon: Laptop },
    { value: "light", labelTh: "☀️ สว่าง (Light)", labelEn: "☀️ Light", icon: Sun },
    { value: "dark", labelTh: "🌙 มืด (Dark)", labelEn: "🌙 Dark", icon: Moon },
  ];

  return (
    <div className="relative inline-block" ref={menuRef}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(!open)}
        className="h-8.5 w-8.5 rounded-lg border border-border text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer shadow-2xs"
        title={lang === "th" ? "ปรับแต่งธีม (System / Light / Dark)" : "Theme (System / Light / Dark)"}
        aria-label="Toggle Theme"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="h-4 w-4 text-emerald-400" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border bg-card p-1.5 shadow-xl z-50 text-xs animate-in fade-in space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b mb-1">
            {lang === "th" ? "เลือกโหมดธีม (Theme)" : "Select Theme"}
          </div>
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTheme(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{lang === "th" ? opt.labelTh : opt.labelEn}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
