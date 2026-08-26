import type { Metadata } from "next";
import "./globals.css";
import { TaskProvider } from "@/lib/store/task-store";
import { LanguageProvider } from "@/lib/i18n/language-context";

export const metadata: Metadata = {
  title: "TaskFlow Manager — Operational Visibility",
  description: "ระบบติดตามงานและการทำงานร่วมกันสำหรับองค์กร (Phase 1 MVP)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <LanguageProvider>
          <TaskProvider>{children}</TaskProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
