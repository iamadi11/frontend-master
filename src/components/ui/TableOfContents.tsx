"use client";

import { useEffect, useState } from "react";
import { SerializedEditorState } from "lexical";
import { extractHeadings, type Heading } from "@/lib/toc";
import { useMotionPrefs } from "@/components/motion/MotionPrefsProvider";

interface TableOfContentsProps {
  content: SerializedEditorState | null | undefined;
  className?: string;
}

export function TableOfContents({
  content,
  className = "",
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const { reduced } = useMotionPrefs();

  useEffect(() => {
    setHeadings(extractHeadings(content));
  }, [content]);

  if (headings.length === 0) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: reduced ? "auto" : "smooth",
      });
    }
  };

  return (
    <nav className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Contents
      </h3>
      <ul className="space-y-1 text-sm">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className={`
                block py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                ${
                  heading.level === 2
                    ? "font-medium"
                    : heading.level === 3
                      ? "ml-4 text-gray-600 dark:text-gray-400"
                      : "ml-8 text-gray-500 dark:text-gray-500"
                }
              `}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
