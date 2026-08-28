import type { Metadata } from "next";
import "./globals.css";
import { TaskProvider } from "@/lib/store/task-store";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

export const metadata: Metadata = {
  title: "Lighthouse — ประภาคารนำทางความสำเร็จในการบริหารงาน",
  description: "ระบบติดตามงานและบริหารบุคลากร Lighthouse TaskFlow — Baansuay Land & House / MeDTree",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TaskFlow",
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
        <ServiceWorkerRegister />
        <ThemeProvider>
          <LanguageProvider>
            <TaskProvider>{children}</TaskProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
