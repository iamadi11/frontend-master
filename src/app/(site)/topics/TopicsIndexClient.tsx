"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import type { TopicListItem } from "@/lib/types";

interface TopicsIndexClientProps {
  topics: TopicListItem[];
}

export function TopicsIndexClient({ topics }: TopicsIndexClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return topics;

    const query = searchQuery.toLowerCase();
    return topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.summary?.toLowerCase().includes(query) ||
        topic.order.toString().includes(query)
    );
  }, [topics, searchQuery]);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "intermediate":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
      case "advanced":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">Learning Path</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Complete curriculum for Frontend System Design. Each topic includes
          detailed theory and hands-on practice.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search topics..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
        />
      </div>

      {/* Topics List */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No topics found matching &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTopics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.slug}`}
              className="group block p-6 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all bg-white dark:bg-gray-900"
            >
              <div className="flex items-start gap-4">
                {/* Order Badge */}
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center font-bold text-lg text-gray-600 dark:text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {topic.order}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {topic.title}
                    </h3>
                    {topic.difficulty && (
                      <span
                        className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(
                          topic.difficulty
                        )}`}
                      >
                        {topic.difficulty}
                      </span>
                    )}
                  </div>
                  {topic.summary && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {topic.summary}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Count */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredTopics.length} of {topics.length} topics
      </div>
    </div>
  );
}
