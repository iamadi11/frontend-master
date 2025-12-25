"use client";

import React from "react";
import { SerializedEditorState } from "lexical";
import type { LexicalNode } from "@/lib/types";
// Re-export for backward compatibility
export { extractHeadings } from "@/lib/toc";

function extractTextFromNode(node: LexicalNode): string {
  if (node.type === "text") {
    return node.text || "";
  }
  if (node.children) {
    return node.children.map((child) => extractTextFromNode(child)).join("");
  }
  return "";
}

// Track used IDs to ensure uniqueness
let usedHeadingIds = new Set<string>();

function resetHeadingIds() {
  usedHeadingIds = new Set<string>();
}

function generateStableHeadingId(text: string): string {
  const slugify = (t: string) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "heading";

  let baseId = slugify(text);
  let finalId = baseId;
  let counter = 2;

  while (usedHeadingIds.has(finalId)) {
    finalId = `${baseId}-${counter}`;
    counter++;
  }

  usedHeadingIds.add(finalId);
  return finalId;
}

interface RichTextRendererProps {
  content: SerializedEditorState | null | undefined;
  onHeadingsChange?: (
    headings: Array<{ id: string; text: string; level: number }>
  ) => void;
}

export function RichTextRenderer({
  content,
  onHeadingsChange,
}: RichTextRendererProps) {
  // Reset heading IDs on each render to ensure consistency
  React.useEffect(() => {
    resetHeadingIds();
  }, [content]);

  // Handle null/undefined/empty
  if (!content) {
    return null; // Let parent handle empty state
  }

  // Handle different content structures
  let rootNode: LexicalNode | null = null;

  if (content && typeof content === "object" && content !== null) {
    const contentObj = content as unknown as Record<string, unknown>;

    // Check for standard Lexical structure: { root: { children: [...] } }
    if ("root" in contentObj && contentObj.root) {
      const root = contentObj.root;
      if (typeof root === "object" && root !== null) {
        const rootObj = root as Record<string, unknown>;
        if ("children" in rootObj && Array.isArray(rootObj.children)) {
          rootNode = rootObj as unknown as LexicalNode;
        }
      }
    }
    // Check if content itself is the root node
    else if (
      "children" in contentObj &&
      Array.isArray(contentObj.children) &&
      "type" in contentObj &&
      contentObj.type === "root"
    ) {
      rootNode = content as unknown as LexicalNode;
    }
    // Check if content has children at top level
    else if ("children" in contentObj && Array.isArray(contentObj.children)) {
      rootNode = {
        type: "root",
        children: contentObj.children as LexicalNode[],
      };
    }
  }

  if (!rootNode) {
    return null; // Let parent handle empty state
  }

  // Check for children array
  if (!rootNode.children || !Array.isArray(rootNode.children)) {
    return null; // Let parent handle empty state
  }

  // If children array is empty, return null
  if (rootNode.children.length === 0) {
    return null; // Let parent handle empty state
  }

  const renderNode = (node: LexicalNode): React.ReactNode => {
    if (!node) return null;

    switch (node.type) {
      case "heading":
        const tagName = (node.tag || "h1").toLowerCase();
        const headingContent = node.children?.map((child, i: number) => (
          <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
        ));

        // Generate stable ID from heading text
        const headingText = extractTextFromNode(node);
        const headingId = headingText
          ? generateStableHeadingId(headingText)
          : `heading-${Math.random().toString(36).substr(2, 9)}`;

        // Use explicit switch to avoid dynamic component name issues
        switch (tagName) {
          case "h1":
            return (
              <h1
                id={headingId}
                className="mt-8 mb-4 font-bold text-3xl scroll-mt-24"
              >
                {headingContent}
              </h1>
            );
          case "h2":
            return (
              <h2
                id={headingId}
                className="mt-8 mb-4 font-bold text-2xl scroll-mt-24"
              >
                {headingContent}
              </h2>
            );
          case "h3":
            return (
              <h3
                id={headingId}
                className="mt-6 mb-3 font-bold text-xl scroll-mt-24"
              >
                {headingContent}
              </h3>
            );
          case "h4":
            return (
              <h4
                id={headingId}
                className="mt-6 mb-3 font-bold text-lg scroll-mt-24"
              >
                {headingContent}
              </h4>
            );
          case "h5":
            return (
              <h5 id={headingId} className="mt-4 mb-2 font-bold scroll-mt-24">
                {headingContent}
              </h5>
            );
          case "h6":
            return (
              <h6
                id={headingId}
                className="mt-4 mb-2 font-bold text-sm scroll-mt-24"
              >
                {headingContent}
              </h6>
            );
          default:
            return (
              <h1
                id={headingId}
                className="mt-8 mb-4 font-bold text-3xl scroll-mt-24"
              >
                {headingContent}
              </h1>
            );
        }
      case "paragraph":
        return (
          <p className="mb-4 leading-7">
            {node.children?.map((child, i: number) => (
              <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
            ))}
          </p>
        );
      case "list":
        const ListTag = node.listType === "number" ? "ol" : "ul";
        return (
          <ListTag
            className={`mb-4 ml-6 ${
              node.listType === "number" ? "list-decimal" : "list-disc"
            } space-y-2`}
          >
            {node.children?.map((child, i: number) => (
              <li key={i}>{renderNode(child)}</li>
            ))}
          </ListTag>
        );
      case "listitem":
        return (
          <>
            {node.children?.map((child, i: number) => (
              <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
            ))}
          </>
        );
      case "text":
        let text: React.ReactNode = node.text || "";
        if (node.format) {
          if (node.format & 1) text = <strong key="bold">{text}</strong>;
          if (node.format & 2) text = <em key="italic">{text}</em>;
          if (node.format & 4)
            text = (
              <code
                key="code"
                className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
              >
                {text}
              </code>
            );
        }
        return <span>{text}</span>;
      case "link":
        return (
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {node.children?.map((child, i: number) => (
              <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
            ))}
          </a>
        );
      case "quote":
      case "blockquote":
        return (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 py-2 my-4 italic text-gray-700 dark:text-gray-300">
            {node.children?.map((child, i: number) => (
              <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
            ))}
          </blockquote>
        );
      case "code":
        // Handle code blocks
        const codeText = extractTextFromNode(node);
        return (
          <pre className="mb-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-x-auto">
            <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
              {codeText}
            </code>
          </pre>
        );
      default:
        // Gracefully handle unknown nodes
        if (node.children) {
          return (
            <>
              {node.children.map((child, i: number) => (
                <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
              ))}
            </>
          );
        }
        return null;
    }
  };

  return (
    <div>
      {rootNode.children.map((child, i: number) => (
        <div key={i}>{renderNode(child)}</div>
      ))}
    </div>
  );
}
