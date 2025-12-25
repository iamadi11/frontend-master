import { notFound } from "next/navigation";
import { getTopicBySlug, getAdjacentTopics, listTopics } from "@/lib/content";
import { TopicPageClient } from "./TopicPageClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);

  if (!topic) {
    return {
      title: "Topic Not Found",
    };
  }

  return {
    title: `${topic.title} | Frontend System Design`,
    description: topic.summary || `Learn ${topic.title} - theory and practice.`,
  };
}

export async function generateStaticParams() {
  const topics = await listTopics();
  return topics.map((topic) => ({
    slug: topic.slug,
  }));
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Fetch topics list once (cached) and use for both topic and adjacent lookup
  const [allTopics, topic] = await Promise.all([
    listTopics(),
    getTopicBySlug(slug),
  ]);

  if (!topic) {
    notFound();
  }

  // Use topics list for adjacent lookup (no additional API call)
  const adjacent = getAdjacentTopics(slug, allTopics);

  // Ensure theory is properly serialized for client component
  // Payload's richText should be serializable, but we'll ensure it's a plain object
  const serializedTopic = {
    ...topic,
    theory: topic.theory ? JSON.parse(JSON.stringify(topic.theory)) : null,
  };

  return (
    <TopicPageClient
      topic={serializedTopic}
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
