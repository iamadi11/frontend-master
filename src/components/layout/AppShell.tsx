"use client";

import { type ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <div className="flex-1 flex">
        <main className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export { AppShell };
