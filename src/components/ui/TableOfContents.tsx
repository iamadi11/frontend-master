"use client";

import { useEffect, useState } from "react";
import { SerializedEditorState } from "lexical";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: SerializedEditorState | null | undefined;
  className?: string;
}

function extractHeadings(
  content: SerializedEditorState | null | undefined
): Heading[] {
  if (!content?.root?.children) return [];

  const headings: Heading[] = [];

  function traverse(node: any, level = 0) {
    if (node.type === "heading") {
      const headingLevel = parseInt(node.tag?.replace("h", "") || "1");
      const text = extractText(node);
      if (text) {
        // Generate ID that matches RichTextRenderer
        const id =
          text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || `heading-${headings.length}`;
        headings.push({
          id,
          text,
          level: headingLevel,
        });
      }
    }

    if (node.children) {
      node.children.forEach((child: any) => traverse(child, level + 1));
    }
  }

  function extractText(node: any): string {
    if (node.type === "text") {
      return node.text || "";
    }
    if (node.children) {
      return node.children.map((child: any) => extractText(child)).join("");
    }
    return "";
  }

  content.root.children.forEach((node: any) => traverse(node));
  return headings;
}

export function TableOfContents({
  content,
  className = "",
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    setHeadings(extractHeadings(content));
  }, [content]);

  if (headings.length === 0) {
    return null;
  }

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
              className={`
                block py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                ${
                  heading.level === 1
                    ? "font-medium"
                    : heading.level === 2
                      ? "ml-4"
                      : "ml-8 text-gray-600 dark:text-gray-400"
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
