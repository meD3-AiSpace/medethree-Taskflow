import type { Metadata } from "next";
import "./globals.css";
import { TaskProvider } from "@/lib/store/task-store";
import { LanguageProvider } from "@/lib/i18n/language-context";

export const metadata: Metadata = {
  title: "Lighthouse — ประภาคารนำทางความสำเร็จในการบริหารงาน",
  description: "ระบบติดตามงานและบริหารบุคลากร Lighthouse TaskFlow — ประภาคารที่นำแสงไฟสู่เรือที่กำลังหลงทางกลางพายุที่มืดมิด",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
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
