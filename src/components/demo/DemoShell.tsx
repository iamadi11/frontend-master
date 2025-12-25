"use client";

import { ReactNode } from "react";

interface DemoShellProps {
  controls: ReactNode;
  visualization: ReactNode;
  eventLog: ReactNode;
}

export function DemoShell({
  controls,
  visualization,
  eventLog,
}: DemoShellProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
              Constraints
            </h3>
            <div className="space-y-4">{controls}</div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
            Architecture Decisions
          </h3>
          <div className="min-h-[400px]">{visualization}</div>
        </div>
      </div>
      {eventLog}
    </div>
  );
}
