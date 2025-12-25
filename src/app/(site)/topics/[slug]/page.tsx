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

  // Diagnostic logging - remove after fixing
  if (process.env.NODE_ENV === "development") {
    console.log("[DEBUG] Theory data for", slug, ":", {
      hasTheory: !!topic.theory,
      theoryKeys: topic.theory ? Object.keys(topic.theory) : [],
      hasRoot: !!topic.theory?.root,
      rootKeys: topic.theory?.root ? Object.keys(topic.theory.root) : [],
      childrenCount: topic.theory?.root?.children?.length || 0,
      firstChild: topic.theory?.root?.children?.[0],
    });
  }

  // Ensure theory is properly serialized for client component
  // Payload's richText should be serializable, but we'll ensure it's a plain object
  const serializedTopic = {
    ...topic,
    theory: topic.theory ? JSON.parse(JSON.stringify(topic.theory)) : null,
  };

  return (
    <TopicPageClient
      topic={serializedTopic as any}
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
