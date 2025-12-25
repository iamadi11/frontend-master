import { listCurriculumModules } from "@/lib/content";
import { EmptyState } from "@/components/ui/EmptyState";
import { TopicsIndexClient } from "./TopicsIndexClient";

export const metadata = {
  title: "All Topics | Frontend System Design",
  description:
    "Complete curriculum for Frontend System Design. 12 comprehensive modules covering theory and interactive examples.",
};

export default async function TopicsPage() {
  let modules: Array<{
    id: string;
    title: string;
    slug: string;
    order: number;
    summary: string | null;
  }> = [];
  let error: string | null = null;

  try {
    const result = await listCurriculumModules();
    modules = result.map((m) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      order: m.order,
      summary: m.summary ?? null,
    }));
  } catch (e) {
    error = "Failed to load modules";
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

  if (modules.length === 0) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <EmptyState
          title="No modules available"
          description="Modules will appear here once they're added to the CMS."
          action={{ label: "Go to Admin", href: "/admin" }}
        />
      </div>
    );
  }

  return <TopicsIndexClient topics={modules} />;
}
