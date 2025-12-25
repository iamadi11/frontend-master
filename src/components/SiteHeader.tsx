"use client";

import Link from "next/link";
import { Home, BookOpen, Settings } from "lucide-react";
import { ReduceMotionToggle } from "./motion/ReduceMotionToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg">
            Learning Content
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              href="/resources"
              className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
            >
              <BookOpen className="w-4 h-4" />
              Resources
            </Link>
            <Link
              href="/topics"
              className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
            >
              <BookOpen className="w-4 h-4" />
              Topics
            </Link>
            <ReduceMotionToggle />
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
            >
              <Settings className="w-4 h-4" />
              Admin
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
