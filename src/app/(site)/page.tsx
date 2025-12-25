import Link from "next/link";
import { listTopics } from "@/lib/content";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function HomePage() {
  let topics: any[] = [];
  let error: string | null = null;

  try {
    topics = await listTopics();
  } catch (e) {
    error = "Failed to load topics";
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold mb-4">Frontend System Design</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Learn frontend system design through structured theory and hands-on
          practice. Each topic covers both concepts and real-world applications.
        </p>
        <Link
          href="/topics"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Start Learning
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {topics.length === 0 && !error ? (
        <EmptyState
          title="No topics available"
          description="Topics will appear here once they're added to the CMS."
          action={{ label: "Go to Admin", href: "/admin" }}
        />
      ) : topics.length > 0 ? (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Topics</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {topics.slice(0, 6).map((topic) => (
              <Link
                key={topic.id}
                href={`/topics/${topic.slug}`}
                className="block p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-white dark:bg-gray-900"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    Topic {topic.order}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{topic.title}</h3>
                {topic.summary && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {topic.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
          {topics.length > 6 && (
            <div className="mt-6 text-center">
              <Link
                href="/topics"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all {topics.length} topics →
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
