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
  return topics.map((topic: any) => ({
    slug: topic.slug,
  }));
}

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
