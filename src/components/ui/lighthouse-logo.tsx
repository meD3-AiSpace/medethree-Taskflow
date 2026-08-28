"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LighthouseLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showTagline?: boolean;
  animateBeam?: boolean;
  className?: string;
}

const sizeConfig = {
  xs: {
    container: "h-7 w-7",
    imgSize: 28,
    textClass: "text-xs font-black",
    subTextClass: "text-[9px] font-bold",
    beamScale: "scale-[0.8]",
    lanternTop: "24%",
  },
  sm: {
    container: "h-10 w-10",
    imgSize: 40,
    textClass: "text-sm font-black tracking-tight",
    subTextClass: "text-[10px] font-bold tracking-wider",
    beamScale: "scale-100",
    lanternTop: "24%",
  },
  md: {
    container: "h-14 w-14",
    imgSize: 56,
    textClass: "text-base font-black tracking-tight",
    subTextClass: "text-xs font-bold tracking-wider",
    beamScale: "scale-125",
    lanternTop: "24%",
  },
  lg: {
    container: "h-20 w-20",
    imgSize: 80,
    textClass: "text-xl font-black tracking-tight",
    subTextClass: "text-xs font-bold tracking-wider",
    beamScale: "scale-150",
    lanternTop: "24%",
  },
  xl: {
    container: "h-28 w-28",
    imgSize: 112,
    textClass: "text-2xl font-black tracking-tight",
    subTextClass: "text-sm font-bold tracking-wider",
    beamScale: "scale-[2]",
    lanternTop: "24%",
  },
};

export function LighthouseLogo({
  size = "sm",
  showText = false,
  showTagline = false,
  animateBeam = true,
  className,
}: LighthouseLogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      {/* Lighthouse Emblem with Rotating Beacon */}
      <div className={cn("relative shrink-0 flex items-center justify-center", config.container)}>
        {/* Ambient Lighthouse Glow */}
        {animateBeam && (
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md pointer-events-none animate-lighthouse-glow" />
        )}

        {/* 360-Degree Rotating Beacon Light Beam */}
        {animateBeam && (
          <div
            className="absolute z-10 pointer-events-none flex items-center justify-center"
            style={{
              top: "24%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "160%",
              height: "160%",
            }}
          >
            {/* Spinning Dual Light Beams */}
            <div className="relative w-full h-full animate-lighthouse-beam flex items-center justify-center">
              {/* Left Beam Cone */}
              <div
                className="absolute right-1/2 h-10 w-24 origin-right"
                style={{
                  background:
                    "conic-gradient(from 75deg at 100% 50%, rgba(253, 224, 71, 0) 0deg, rgba(251, 191, 36, 0.85) 15deg, rgba(245, 158, 11, 0.9) 20deg, rgba(253, 224, 71, 0) 35deg)",
                  filter: "blur(1.5px)",
                }}
              />

              {/* Right Beam Cone */}
              <div
                className="absolute left-1/2 h-10 w-24 origin-left"
                style={{
                  background:
                    "conic-gradient(from 255deg at 0% 50%, rgba(253, 224, 71, 0) 0deg, rgba(251, 191, 36, 0.85) 15deg, rgba(245, 158, 11, 0.9) 20deg, rgba(253, 224, 71, 0) 35deg)",
                  filter: "blur(1.5px)",
                }}
              />

              {/* Central Lantern Point */}
              <div className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b] animate-lighthouse-flare z-20" />
            </div>
          </div>
        )}

        {/* Base Lighthouse Transparent Emblem Image */}
        <div className="relative z-0 w-full h-full flex items-center justify-center drop-shadow-sm">
          <Image
            src="/images/lighthouse-icon.png"
            alt="Lighthouse Logo"
            width={config.imgSize}
            height={config.imgSize}
            className="w-full h-full object-contain"
            priority
          />
        </div>
      </div>

      {/* Typography Brand Name */}
      {showText && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 leading-tight">
            <span
              className={cn(
                "bg-gradient-to-r from-slate-900 via-teal-900 to-slate-800 dark:from-white dark:via-teal-200 dark:to-slate-200 bg-clip-text text-transparent",
                config.textClass
              )}
            >
              Lighthouse
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded shadow-2xs border border-emerald-300/50">
              v3.0
            </span>
          </div>

          <div className="flex items-center gap-1.5 leading-tight">
            <span className={cn("text-teal-600 dark:text-teal-400 uppercase tracking-widest", config.subTextClass)}>
              TaskFlow
            </span>
            {showTagline && (
              <span className="text-[10px] text-muted-foreground hidden sm:inline truncate">
                • ประภาคารนำทางความสำเร็จ
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
