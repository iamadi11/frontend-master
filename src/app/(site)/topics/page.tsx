import Link from "next/link";
import { listTopics } from "@/lib/content";

export default async function TopicsPage() {
  let topics: any[] = [];
  let error: string | null = null;

  try {
    topics = await listTopics();
  } catch (e) {
    error = "Failed to load topics";
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200";
      case "intermediate":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200";
      case "advanced":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Topics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Learn Frontend System Design through interactive topics with Theory
          and Practice sections.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {topics.length === 0 && !error ? (
        <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No topics available yet.
          </p>
          <Link
            href="/admin"
            className="inline-block px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md hover:opacity-90 transition-opacity"
          >
            Go to Admin to add content
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.slug}`}
              className="block p-6 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors bg-white dark:bg-gray-900"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{topic.title}</h3>
                {topic.difficulty && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                      topic.difficulty
                    )}`}
                  >
                    {topic.difficulty.charAt(0).toUpperCase() +
                      topic.difficulty.slice(1)}
                  </span>
                )}
              </div>
              {topic.summary && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {topic.summary}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <span>View Topic</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
