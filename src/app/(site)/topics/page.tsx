import Link from "next/link";
import { listTopics } from "@/lib/content";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function TopicsPage() {
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
        <h1 className="text-4xl font-bold mb-4">All Topics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete learning path for Frontend System Design. Each topic includes
          detailed theory and hands-on practice.
        </p>
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
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.slug}`}
              className="block p-5 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-white dark:bg-gray-900 group"
            >
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
                  {topic.order}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {topic.title}
                  </h3>
                  {topic.summary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {topic.summary}
                    </p>
                  )}
                </div>
                <span className="flex-shrink-0 text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
