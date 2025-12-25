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
    <nav className="mt-16 pt-8 border-t-2 border-gray-200 dark:border-gray-800">
      <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
        {prevTopic && (
          <Link
            href={`/topics/${prevTopic.slug}`}
            className="group flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all bg-white dark:bg-gray-900"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Previous Topic
              </span>
              <span className="font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                {prevTopic.title}
              </span>
            </div>
          </Link>
        )}

        {nextTopic && (
          <Link
            href={`/topics/${nextTopic.slug}`}
            className={`group flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all bg-white dark:bg-gray-900 ${
              !prevTopic ? "md:col-start-2" : ""
            }`}
          >
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Next Topic
              </span>
              <span className="font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                {nextTopic.title}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0" />
          </Link>
        )}
      </div>
    </nav>
  );
}
