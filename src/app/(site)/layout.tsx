import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { ConditionalSidebar } from "@/components/layout/ConditionalSidebar";
import { listTopics } from "@/lib/content";

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Fetch topics once server-side for navigation
  let topics: Array<{
    id: string;
    title: string;
    slug: string;
    order: number;
  }> = [];
  try {
    const result = await listTopics();
    topics = result.map((t) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      order: t.order,
    }));
  } catch (error) {
    // Silently fail - navigation will show empty state
    console.error("Failed to load topics for navigation:", error);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Header />

      <div className="flex-1 flex">
        {/* Desktop Sidebar - Hidden on topic pages (they have their own 3-zone layout) */}
        <ConditionalSidebar topics={topics} />

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation - Hidden on topic pages */}
      <ConditionalSidebar topics={topics} mobile />
    </div>
  );
}
