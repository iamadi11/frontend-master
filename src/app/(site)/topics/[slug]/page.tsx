import { notFound } from "next/navigation";
import { getTopicBySlug, getAdjacentTopics } from "@/lib/content";
import { TopicPageClient } from "./TopicPageClient";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [topic, adjacent] = await Promise.all([
    getTopicBySlug(slug),
    getAdjacentTopics(slug),
  ]);

  if (!topic) {
    notFound();
  }

  return (
    <TopicPageClient
      topic={topic as any}
      prevTopic={
        adjacent.prev
          ? { title: adjacent.prev.title, slug: adjacent.prev.slug }
          : null
      }
      nextTopic={
        adjacent.next
          ? { title: adjacent.next.title, slug: adjacent.next.slug }
          : null
      }
    />
  );
}
