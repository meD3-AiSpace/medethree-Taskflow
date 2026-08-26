"use client";

import React from "react";
import { useLanguage } from "@/lib/i18n/language-context";
import { ThaiFlag, UKFlag } from "@/components/ui/flag-icons";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-lg border border-border/80 bg-background/90 p-0.5 shadow-xs">
      {/* Thai Flag + TH */}
      <button
        type="button"
        onClick={() => setLang("th")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all select-none cursor-pointer active:scale-95 ${
          lang === "th"
            ? "bg-emerald-600 text-white shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
        title="เปลี่ยนเป็นภาษาไทย (TH)"
      >
        <ThaiFlag className="w-4 h-3" />
        <span>TH</span>
      </button>

      {/* UK Flag + EN */}
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all select-none cursor-pointer active:scale-95 ${
          lang === "en"
            ? "bg-emerald-600 text-white shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
        title="Switch to English (EN)"
      >
        <UKFlag className="w-4 h-3" />
        <span>EN</span>
      </button>
    </div>
  );
}
