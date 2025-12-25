import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Header />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="container mx-auto px-4 py-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
