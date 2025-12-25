"use client";

import Link from "next/link";
import { BookOpen, Target, Code, Rocket } from "lucide-react";
import type { TopicListItem } from "@/lib/types";

interface HomePageClientProps {
  topics: TopicListItem[];
  error: string | null;
}

export function HomePageClient({ topics, error }: HomePageClientProps) {
  return (
    <div className="space-y-16 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-8">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          Master Frontend System Design
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Learn through structured theory and hands-on practice. Build the
          skills to design production-ready frontend systems.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link
            href="/topics"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            <BookOpen className="w-5 h-5" />
            Start Learning
          </Link>
          <Link
            href="/topics"
            className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors font-semibold text-lg"
          >
            View All Topics
          </Link>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold">Theory + Practice</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Each topic includes detailed theory backed by references and
            interactive demos to reinforce learning.
          </p>
        </div>
        <div className="space-y-3">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
            <Code className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold">Hands-On Labs</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Learn by doing with interactive labs that simulate real-world system
            design challenges and trade-offs.
          </p>
        </div>
        <div className="space-y-3">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <Rocket className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold">Production-Ready</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Focus on real-world patterns used in production systems, not toy
            examples or abstract concepts.
          </p>
        </div>
      </section>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Topics Preview */}
      {topics.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Learning Path</h2>
            <Link
              href="/topics"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              View all {topics.length} topics →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {topics.slice(0, 6).map((topic) => (
              <Link
                key={topic.id}
                href={`/topics/${topic.slug}`}
                className="group block p-6 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all bg-white dark:bg-gray-900"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center font-semibold text-gray-600 dark:text-gray-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {topic.order}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {topic.title}
                    </h3>
                    {topic.summary && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {topic.summary}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
