"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TopicNavigationProps {
  prevTopic?: { title: string; slug: string } | null;
  nextTopic?: { title: string; slug: string } | null;
}

export function TopicNavigation({
  prevTopic,
  nextTopic,
}: TopicNavigationProps) {
  if (!prevTopic && !nextTopic) {
    return null;
  }

  return (
    <nav className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
      {prevTopic ? (
        <Link
          href={`/topics/${prevTopic.slug}`}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Previous
            </span>
            <span className="font-medium group-hover:underline">
              {prevTopic.title}
            </span>
          </div>
        </Link>
      ) : (
        <div />
      )}

      {nextTopic ? (
        <Link
          href={`/topics/${nextTopic.slug}`}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group ml-auto"
        >
          <div className="flex flex-col text-right">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Next
            </span>
            <span className="font-medium group-hover:underline">
              {nextTopic.title}
            </span>
          </div>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : null}
    </nav>
  );
}
