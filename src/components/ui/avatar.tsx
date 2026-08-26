import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border/50 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarFallback({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-semibold select-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
