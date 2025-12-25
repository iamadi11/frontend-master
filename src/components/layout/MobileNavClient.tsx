"use client";

import { MobileNav } from "./MobileNav";

type Topic = {
  id: string;
  title: string;
  slug: string;
  order: number;
};

interface MobileNavClientProps {
  topics: Topic[];
  currentSlug?: string;
}

export function MobileNavClient({ topics, currentSlug }: MobileNavClientProps) {
  return <MobileNav topics={topics} currentSlug={currentSlug} />;
}
