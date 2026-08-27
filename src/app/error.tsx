"use client";

import React, { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Root Error Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-4 bg-background">
      <div className="h-14 w-14 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
        <AlertCircle className="h-7 w-7" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-foreground">
          ระบบพบข้อผิดพลาดชั่วคราว
        </h2>
        <p className="text-xs text-muted-foreground">
          ข้อมูลหลักของคุณยังคงปลอดภัยบนระบบคลาวด์ กรุณากดปุ่มด้านล่างเพื่อโหลดหน้านี้ใหม่
        </p>
      </div>
      <Button
        onClick={() => reset()}
        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        <span>รีเฟรชระบบใหม่</span>
      </Button>
    </div>
  );
}
