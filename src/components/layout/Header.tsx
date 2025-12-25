"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ReduceMotionToggle } from "@/components/motion/ReduceMotionToggle";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <nav className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-semibold text-lg sm:text-xl hover:opacity-80 transition-opacity truncate"
          >
            <span className="hidden sm:inline">Frontend System Design</span>
            <span className="sm:hidden">FSD</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <Link
              href="/topics"
              className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Topics</span>
            </Link>
            <ThemeToggle />
            <ReduceMotionToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
