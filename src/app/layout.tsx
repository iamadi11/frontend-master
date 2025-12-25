import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ConsoleErrorSuppressor } from "@/components/console-error-suppressor";
import { MotionPrefsProvider } from "@/components/motion/MotionPrefsProvider";
import { SWRegister } from "@/components/sw-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Frontend System Design | Master System Design Through Practice",
  description:
    "Learn frontend system design through structured theory and hands-on practice. Master rendering strategies, state management, performance, architecture, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable} suppressHydrationWarning>
        <ConsoleErrorSuppressor />
        <SWRegister />
        <ThemeProvider>
          <MotionPrefsProvider>{children}</MotionPrefsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
