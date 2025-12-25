import { listTopics } from "@/lib/content";
import { EmptyState } from "@/components/ui/EmptyState";
import { HomePageClient } from "./HomePageClient";
import type { TopicListItem } from "@/lib/types";

export const metadata = {
  title: "Frontend System Design | Learn Theory & Practice",
  description:
    "Master frontend system design through structured theory and hands-on practice. Build production-ready frontend systems.",
};

export default async function HomePage() {
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
    }));
  } catch (e) {
    error = "Failed to load topics";
  }

  if (topics.length === 0 && !error) {
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

  return <HomePageClient topics={topics} error={error} />;
}
