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
    <nav className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="space-y-1">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
          Learning Path
        </h2>
        {topics.map((topic) => {
          const isActive =
            currentSlug === topic.slug || pathname === `/topics/${topic.slug}`;
          return (
            <Link
              key={topic.id}
              href={`/topics/${topic.slug}`}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              `}
            >
              <span className="text-xs text-gray-400 dark:text-gray-500 w-5">
                {topic.order}
              </span>
              <span className="flex-1 truncate">{topic.title}</span>
              {isActive && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
