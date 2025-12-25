"use client";

import { useEffect, useState } from "react";
import { MobileNav } from "./MobileNav";

type Topic = {
  id: string;
  title: string;
  slug: string;
  order: number;
};

interface MobileNavClientProps {
  currentSlug?: string;
}

export function MobileNavClient({ currentSlug }: MobileNavClientProps) {
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const response = await fetch("/api/topics");
        if (response.ok) {
          const data = await response.json();
          setTopics(data);
        }
      } catch (error) {
        console.error("Failed to fetch topics:", error);
      }
    }
    fetchTopics();
  }, []);

  return <MobileNav topics={topics} currentSlug={currentSlug} />;
}
