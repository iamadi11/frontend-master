"use client";

import { SidebarNav } from "./SidebarNav";

type Topic = {
  id: string;
  title: string;
  slug: string;
  order: number;
};

interface SidebarNavClientProps {
  topics: Topic[];
  currentSlug?: string;
}

export function SidebarNavClient({
  topics,
  currentSlug,
}: SidebarNavClientProps) {
  return <SidebarNav topics={topics} currentSlug={currentSlug} />;
}
