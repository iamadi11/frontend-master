"use client";

import React from "react";
import { SerializedEditorState } from "lexical";
import type { LexicalNode } from "@/lib/types";

interface RichTextRendererProps {
  content: SerializedEditorState | null | undefined;
}

function extractTextFromNode(node: LexicalNode): string {
  if (node.type === "text") {
    return node.text || "";
  }
  if (node.children) {
    return node.children.map((child) => extractTextFromNode(child)).join("");
  }
  return "";
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  // Handle null/undefined
  if (!content) {
    return (
      <p className="text-gray-500 dark:text-gray-400 italic">
        Content not available yet.
      </p>
    );
  }

  // Payload CMS may return richText as the root object directly, or nested under root
  // Payload v3 with Lexical returns: { root: { children: [...], type: "root", ... } }
  // Handle both structures: { root: {...} } or direct root object
  let rootNode: LexicalNode | null = null;

  // Check for standard Lexical structure: { root: { children: [...], type: "root" } }
  if (content && typeof content === "object" && content !== null) {
    const contentObj = content as unknown as Record<string, unknown>;

    // First check: content has "root" property
    if ("root" in contentObj && contentObj.root) {
      const root = contentObj.root;
      if (typeof root === "object" && root !== null) {
        const rootObj = root as Record<string, unknown>;
        // Check if root has children array
        if ("children" in rootObj && Array.isArray(rootObj.children)) {
          rootNode = rootObj as unknown as LexicalNode;
        }
      }
    }
    // Second check: content itself is the root node (has children and type="root")
    else if (
      "children" in contentObj &&
      Array.isArray(contentObj.children) &&
      "type" in contentObj &&
      contentObj.type === "root"
    ) {
      rootNode = content as unknown as LexicalNode;
    }
    // Third check: content has children at top level (wrap it)
    else if ("children" in contentObj && Array.isArray(contentObj.children)) {
      rootNode = {
        type: "root",
        children: contentObj.children as LexicalNode[],
      };
    }
  }

  if (!rootNode) {
    if (process.env.NODE_ENV === "development") {
      console.warn("RichTextRenderer: No root node found", {
        content,
        contentType: typeof content,
        contentKeys:
          content && typeof content === "object" ? Object.keys(content) : [],
        hasRoot: !!(
          content &&
          typeof content === "object" &&
          "root" in content
        ),
        rootType:
          content && typeof content === "object" && "root" in content
            ? typeof (content as { root: unknown }).root
            : undefined,
      });
    }
    return (
      <p className="text-gray-500 dark:text-gray-400 italic">
        Content not available yet.
      </p>
    );
  }

  // Check for children array
  if (!rootNode.children || !Array.isArray(rootNode.children)) {
    if (process.env.NODE_ENV === "development") {
      console.warn("RichTextRenderer: Invalid children structure", {
        rootNode,
        hasChildren: !!rootNode.children,
        childrenType: typeof rootNode.children,
        rootNodeKeys: Object.keys(rootNode || {}),
      });
    }
    return (
      <p className="text-gray-500 dark:text-gray-400 italic">
        Content not available yet.
      </p>
    );
  }

  // If children array is empty, show empty state
  if (rootNode.children.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 italic">
        Content not available yet.
      </p>
    );
  }

  const renderNode = (node: LexicalNode): React.ReactNode => {
    if (!node) return null;

    switch (node.type) {
      case "heading":
        // node.tag is already "h1", "h2", etc. from Lexical
        const tagName = (node.tag || "h1").toLowerCase();
        const headingContent = node.children?.map((child, i: number) => (
          <span key={i}>{renderNode(child)}</span>
        ));

        // Generate ID from heading text
        const headingText = extractTextFromNode(node);
        const headingId =
          headingText
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") ||
          `heading-${Math.random().toString(36).substr(2, 9)}`;

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
          <p className="mb-4">
            {node.children?.map((child, i: number) => (
              <span key={i}>{renderNode(child)}</span>
            ))}
          </p>
        );
      case "list":
        const ListTag = node.listType === "number" ? "ol" : "ul";
        return (
          <ListTag className="mb-4 ml-6 list-disc">
            {node.children?.map((child, i: number) => (
              <li key={i}>{renderNode(child)}</li>
            ))}
          </ListTag>
        );
      case "listitem":
        return (
          <>
            {node.children?.map((child, i: number) => (
              <span key={i}>{renderNode(child)}</span>
            ))}
          </>
        );
      case "text":
        let text: React.ReactNode = node.text || "";
        if (node.format) {
          if (node.format & 1) text = <strong key="bold">{text}</strong>;
          if (node.format & 2) text = <em key="italic">{text}</em>;
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
              <span key={i}>{renderNode(child)}</span>
            ))}
          </a>
        );
      default:
        if (node.children) {
          return (
            <>
              {node.children.map((child, i: number) => (
                <span key={i}>{renderNode(child)}</span>
              ))}
            </>
          );
        }
        return null;
    }
  };

  return (
    <div className="prose dark:prose-invert max-w-none">
      {rootNode.children.map((child, i: number) => (
        <div key={i}>{renderNode(child)}</div>
      ))}
    </div>
  );
}
