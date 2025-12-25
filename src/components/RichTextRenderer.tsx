"use client";

import React from "react";
import { SerializedEditorState } from "lexical";

interface RichTextRendererProps {
  content: SerializedEditorState | null | undefined;
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content || !content.root) {
    return (
      <p className="text-gray-500 dark:text-gray-400 italic">
        Content not available yet.
      </p>
    );
  }

  const renderNode = (node: any): React.ReactNode => {
    if (!node) return null;

    switch (node.type) {
      case "heading":
        // node.tag is already "h1", "h2", etc. from Lexical
        const tagName = (node.tag || "h1").toLowerCase();
        const headingContent = node.children?.map((child: any, i: number) => (
          <span key={i}>{renderNode(child)}</span>
        ));

        // Use explicit switch to avoid dynamic component name issues
        switch (tagName) {
          case "h1":
            return <h1 className="mt-6 mb-4 font-bold">{headingContent}</h1>;
          case "h2":
            return <h2 className="mt-6 mb-4 font-bold">{headingContent}</h2>;
          case "h3":
            return <h3 className="mt-6 mb-4 font-bold">{headingContent}</h3>;
          case "h4":
            return <h4 className="mt-6 mb-4 font-bold">{headingContent}</h4>;
          case "h5":
            return <h5 className="mt-6 mb-4 font-bold">{headingContent}</h5>;
          case "h6":
            return <h6 className="mt-6 mb-4 font-bold">{headingContent}</h6>;
          default:
            return <h1 className="mt-6 mb-4 font-bold">{headingContent}</h1>;
        }
      case "paragraph":
        return (
          <p className="mb-4">
            {node.children?.map((child: any, i: number) => (
              <span key={i}>{renderNode(child)}</span>
            ))}
          </p>
        );
      case "list":
        const ListTag = node.listType === "number" ? "ol" : "ul";
        return (
          <ListTag className="mb-4 ml-6 list-disc">
            {node.children?.map((child: any, i: number) => (
              <li key={i}>{renderNode(child)}</li>
            ))}
          </ListTag>
        );
      case "listitem":
        return (
          <>
            {node.children?.map((child: any, i: number) => (
              <span key={i}>{renderNode(child)}</span>
            ))}
          </>
        );
      case "text":
        let text = node.text || "";
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
            {node.children?.map((child: any, i: number) => (
              <span key={i}>{renderNode(child)}</span>
            ))}
          </a>
        );
      default:
        if (node.children) {
          return (
            <>
              {node.children.map((child: any, i: number) => (
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
      {content.root.children?.map((child: any, i: number) => (
        <div key={i}>{renderNode(child)}</div>
      ))}
    </div>
  );
}
