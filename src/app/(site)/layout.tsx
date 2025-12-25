import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { SidebarNavClient } from "@/components/layout/SidebarNavClient";
import { MobileNavClient } from "@/components/layout/MobileNavClient";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Header />

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-gray-200 dark:border-gray-800 sticky top-16 self-start">
          <div className="p-4">
            <SidebarNavClient />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavClient />
    </div>
  );
}
