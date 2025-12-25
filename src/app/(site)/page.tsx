import Link from "next/link";
import { listResources } from "@/lib/content";

export default async function HomePage() {
  let resources: any[] = [];
  let error: string | null = null;

  try {
    resources = await listResources();
  } catch (e) {
    error = "Failed to load resources";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
        <p className="text-gray-600 dark:text-gray-400">
          A distraction-free learning content platform.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {resources.length === 0 && !error ? (
        <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No resources available yet.
          </p>
          <Link
            href="/admin"
            className="inline-block px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md hover:opacity-90 transition-opacity"
          >
            Go to Admin to add content
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Resources</h2>
          <div className="space-y-4">
            {resources.map((resource) => (
              <Link
                key={resource.id}
                href={`/resources/${resource.resourceNumber}`}
                className="block p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
              >
                <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                {resource.summary && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {resource.summary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
