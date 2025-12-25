"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

type Topic = {
  id: string;
  title: string;
  slug: string;
  order: number;
};

interface SidebarNavProps {
  topics: Topic[];
  currentSlug?: string;
}

export function SidebarNav({ topics, currentSlug }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4">
      <div className="space-y-1">
        <div className="px-2 mb-4">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Learning Path
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {topics.length} topics
          </p>
        </div>
        {topics.map((topic) => {
          const isActive =
            currentSlug === topic.slug || pathname === `/topics/${topic.slug}`;
          return (
            <Link
              key={topic.id}
              href={`/topics/${topic.slug}`}
              className={`
                flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all group
                ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-0.5"
                }
              `}
            >
              <span
                className={`text-xs font-semibold w-5 text-center ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {topic.order}
              </span>
              <span className="flex-1 truncate leading-snug">
                {topic.title}
              </span>
              {isActive && (
                <ChevronRight className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
