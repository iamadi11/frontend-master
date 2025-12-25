"use client";

import { ReactNode, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionPrefs } from "../motion/MotionPrefsProvider";

interface PanelCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

function PanelCard({
  title,
  children,
  className = "",
  collapsible = false,
  defaultOpen = true,
}: PanelCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { reduced } = useMotionPrefs();

  if (!collapsible) {
    return (
      <div
        className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg ${className}`}
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <div className="p-4">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg ${className}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduced ? {} : { height: 0, opacity: 0 }}
            animate={reduced ? {} : { height: "auto", opacity: 1 }}
            exit={reduced ? {} : { height: 0, opacity: 0 }}
            transition={reduced ? {} : { duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PracticeShellProps {
  controls: ReactNode;
  steps: ReactNode;
  tasks: ReactNode;
  visualization: ReactNode;
  eventLog: ReactNode;
  solution?: ReactNode;
  whatToObserve?: ReactNode;
}

export function PracticeShell({
  controls,
  steps,
  tasks,
  visualization,
  eventLog,
  solution,
  whatToObserve,
}: PracticeShellProps) {
  return (
    <>
      {/* Desktop Layout: 3-zone grid */}
      <div className="hidden lg:grid lg:grid-cols-[280px_minmax(0,_1fr)_320px] gap-6">
        {/* Left Panel */}
        <aside className="space-y-4">
          <div className="sticky top-24 space-y-4">
            {controls && (
              <PanelCard title="Controls" collapsible={false}>
                {controls}
              </PanelCard>
            )}
            {steps && (
              <PanelCard title="Guided Steps" collapsible={false}>
                {steps}
              </PanelCard>
            )}
            {tasks && (
              <PanelCard title="Tasks" collapsible={true} defaultOpen={false}>
                {tasks}
              </PanelCard>
            )}
          </div>
        </aside>

        {/* Center Panel */}
        <main className="space-y-4 min-w-0">
          {/* Visualization Card */}
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

          {/* What to Observe */}
          {whatToObserve && (
            <PanelCard title="What to Observe" collapsible={false}>
              {whatToObserve}
            </PanelCard>
          )}
        </main>

        {/* Right Panel */}
        <aside className="space-y-4">
          <div className="sticky top-24 space-y-4">
            {/* EventLog */}
            {eventLog && (
              <PanelCard title="Event Log" collapsible={false}>
                {eventLog}
              </PanelCard>
            )}

            {/* Solution */}
            {solution && (
              <PanelCard
                title="Solution"
                collapsible={true}
                defaultOpen={false}
              >
                {solution}
              </PanelCard>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Layout: Stacked with accordions */}
      <div className="lg:hidden space-y-4">
        {/* Visualization */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Visualization
            </h3>
          </div>
          <div className="p-4 min-h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
            {visualization}
          </div>
        </div>

        {/* What to Observe */}
        {whatToObserve && (
          <PanelCard
            title="What to Observe"
            collapsible={true}
            defaultOpen={true}
          >
            {whatToObserve}
          </PanelCard>
        )}

        {/* Controls */}
        {controls && (
          <PanelCard title="Controls" collapsible={true} defaultOpen={false}>
            {controls}
          </PanelCard>
        )}

        {/* Guided Steps */}
        {steps && (
          <PanelCard
            title="Guided Steps"
            collapsible={true}
            defaultOpen={false}
          >
            {steps}
          </PanelCard>
        )}

        {/* Tasks */}
        {tasks && (
          <PanelCard title="Tasks" collapsible={true} defaultOpen={false}>
            {tasks}
          </PanelCard>
        )}

        {/* Solution */}
        {solution && (
          <PanelCard title="Solution" collapsible={true} defaultOpen={false}>
            {solution}
          </PanelCard>
        )}

        {/* EventLog */}
        {eventLog && (
          <PanelCard title="Event Log" collapsible={true} defaultOpen={false}>
            {eventLog}
          </PanelCard>
        )}
      </div>
    </>
  );
}
