"use client";

import React, { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Main Layout Error Boundary Caught]:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4">
      <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-lg font-bold text-foreground">
          เกิดข้อผิดพลาดในการแสดงผลหน้านี้
        </h2>
        <p className="text-xs text-muted-foreground">
          ระบบยังคงทำงานได้ตามปกติ คุณสามารถกดสลับเมนูอื่นทางด้านซ้าย หรือกดปุ่มด้านล่างเพื่อโหลดหน้านี้ใหม่อีกครั้ง
        </p>
      </div>
      <Button
        onClick={() => reset()}
        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>ลองโหลดหน้านี้ใหม่อีกครั้ง</span>
      </Button>
    </div>
  );
}
