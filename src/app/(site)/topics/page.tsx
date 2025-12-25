import { listTopics } from "@/lib/content";
import { EmptyState } from "@/components/ui/EmptyState";
import { TopicsIndexClient } from "./TopicsIndexClient";
import type { TopicListItem } from "@/lib/types";

export const metadata = {
  title: "All Topics | Frontend System Design",
  description:
    "Complete curriculum for Frontend System Design. 12 comprehensive topics covering theory and practice.",
};

export default async function TopicsPage() {
  let topics: TopicListItem[] = [];
  let error: string | null = null;

  try {
    const result = await listTopics();
    topics = result.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      order: t.order,
      summary: t.summary ?? null,
      difficulty: t.difficulty ?? null,
    }));
  } catch (e) {
    error = "Failed to load topics";
  }

  if (error) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <EmptyState
          title="No topics available"
          description="Topics will appear here once they're added to the CMS."
          action={{ label: "Go to Admin", href: "/admin" }}
        />
      </div>
    );
  }

  return <TopicsIndexClient topics={topics} />;
}
