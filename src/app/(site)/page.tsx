import { listCurriculumModules } from "@/lib/content";
import { EmptyState } from "@/components/ui/EmptyState";
import { HomePageClient } from "./HomePageClient";

export const metadata = {
  title: "Frontend System Design | Learn System Design",
  description:
    "Master frontend system design through structured theory and interactive examples. Build production-ready frontend systems.",
};

export default async function HomePage() {
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

  if (modules.length === 0 && !error) {
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

  return <HomePageClient topics={modules} error={error} />;
}
