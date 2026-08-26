import * as React from "react";

// Crisp SVG Flag for Thailand 🇹🇭
export function ThaiFlag({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 600"
      className={`inline-block rounded-xs shadow-xs shrink-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <rect width="900" height="600" fill="#A51931" />
      <rect y="100" width="900" height="400" fill="#F4F5F8" />
      <rect y="200" width="900" height="200" fill="#2D2A4A" />
    </svg>
  );
}

// Crisp SVG Flag for UK / English 🇬🇧
export function UKFlag({ className = "w-5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={`inline-block rounded-xs shadow-xs shrink-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <clipPath id="s">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          clipPath="url(#t)"
          stroke="#C8102E"
          strokeWidth="4"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}
