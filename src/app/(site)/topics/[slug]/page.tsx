import { notFound } from "next/navigation";
import { getTopicBySlug } from "@/lib/content";
import { TopicPageClient } from "./TopicPageClient";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);

  if (!topic) {
    notFound();
  }

  return <TopicPageClient topic={topic as any} />;
}
