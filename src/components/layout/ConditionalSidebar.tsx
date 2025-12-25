"use client";

import { usePathname } from "next/navigation";
import { SidebarNavClient } from "./SidebarNavClient";
import { MobileNavClient } from "./MobileNavClient";

type Topic = {
  id: string;
  title: string;
  slug: string;
  order: number;
};

interface ConditionalSidebarProps {
  topics: Topic[];
  mobile?: boolean;
}

export function ConditionalSidebar({
  topics,
  mobile = false,
}: ConditionalSidebarProps) {
  const pathname = usePathname();
  const isTopicPage =
    pathname?.startsWith("/topics/") && pathname !== "/topics";

  // Hide sidebar on topic pages (they have their own 3-zone layout)
  if (isTopicPage) {
    return null;
  }

  if (mobile) {
    return <MobileNavClient topics={topics} />;
  }

  return (
    <aside className="hidden lg:block w-64 border-r border-gray-200 dark:border-gray-800 sticky top-16 self-start">
      <div className="p-4">
        <SidebarNavClient topics={topics} />
      </div>
    </aside>
  );
}
