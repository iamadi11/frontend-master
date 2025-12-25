"use client";

import { useEffect, useState } from "react";
import { SidebarNav } from "./SidebarNav";

type Topic = {
  id: string;
  title: string;
  slug: string;
  order: number;
};

interface SidebarNavClientProps {
  currentSlug?: string;
}

export function SidebarNavClient({ currentSlug }: SidebarNavClientProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  return <SidebarNav topics={topics} currentSlug={currentSlug} />;
}
