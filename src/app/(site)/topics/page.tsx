import { listTopics } from "@/lib/content";
import { EmptyState } from "@/components/ui/EmptyState";
import { TopicsIndexClient } from "./TopicsIndexClient";

export const metadata = {
  title: "All Topics | Frontend System Design",
  description:
    "Complete curriculum for Frontend System Design. 12 comprehensive topics covering theory and practice.",
};

type Topic = {
  id: string;
  title: string;
  slug: string;
  order: number;
  summary?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
};

export default async function TopicsPage() {
  let topics: Topic[] = [];
  let error: string | null = null;

  try {
    const result = await listTopics();
    topics = result.map((t: any) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      order: t.order,
      summary: t.summary,
      difficulty: t.difficulty,
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
