"use client";

import { ReactNode } from "react";

interface DemoShellProps {
  controls: ReactNode;
  visualization: ReactNode;
  eventLog: ReactNode;
}

/**
 * Legacy DemoShell - kept for backward compatibility with existing demos
 * New PracticeShell provides the 3-zone layout
 */
export function DemoShell({
  controls,
  visualization,
  eventLog,
}: DemoShellProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,_1fr)_320px] gap-6">
        {/* Left: Controls */}
        <aside className="space-y-4">
          <div className="sticky top-24">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Controls
                </h3>
              </div>
              <div className="p-4 space-y-4">{controls}</div>
            </div>
          </div>
        </aside>

        {/* Center: Visualization */}
        <main className="min-w-0">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Visualization
              </h3>
            </div>
            <div className="p-6 min-h-[400px] flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
              {visualization}
            </div>
          </div>
        </main>

        {/* Right: EventLog */}
        <aside className="space-y-4">
          <div className="sticky top-24">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Event Log
                </h3>
              </div>
              <div className="p-4">{eventLog}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
