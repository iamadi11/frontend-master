"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionPrefs } from "@/components/motion/MotionPrefsProvider";

type Topic = {
  id: string;
  title: string;
  slug: string;
  order: number;
};

interface MobileNavProps {
  topics: Topic[];
  currentSlug?: string;
}

export function MobileNav({ topics, currentSlug }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { reduced } = useMotionPrefs();
  const [mounted, setMounted] = useState(false);

  // Ensure consistent rendering between server and client
  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial render, only use currentSlug prop (from server)
  // After mount, use pathname for client-side navigation
  const getIsActive = (topicSlug: string) => {
    if (!mounted) {
      // Server-side and initial render: only use currentSlug prop
      return currentSlug === topicSlug;
    }
    // Client-side: use pathname
    return currentSlug === topicSlug || pathname === `/topics/${topicSlug}`;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={reduced ? {} : { opacity: 0 }}
              animate={reduced ? {} : { opacity: 1 }}
              exit={reduced ? {} : { opacity: 0 }}
              transition={reduced ? {} : { duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={reduced ? {} : { x: "100%" }}
              animate={reduced ? {} : { x: 0 }}
              exit={reduced ? {} : { x: "100%" }}
              transition={
                reduced ? {} : { type: "spring", damping: 25, stiffness: 200 }
              }
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-50 shadow-xl lg:hidden overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h2 className="font-semibold text-lg">Topics</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-4 space-y-1">
                {topics.map((topic) => {
                  const isActive = getIsActive(topic.slug);
                  return (
                    <Link
                      key={topic.id}
                      href={`/topics/${topic.slug}`}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors
                        ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }
                      `}
                    >
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-6 text-center">
                        {topic.order}
                      </span>
                      <span className="flex-1">{topic.title}</span>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
