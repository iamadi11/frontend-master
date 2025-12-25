import type { LexicalNode } from "@/lib/types";
import { SerializedEditorState } from "lexical";

export interface Heading {
  id: string;
  text: string;
  level: number;
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

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "heading"
  );
}

/**
 * Generate stable, deterministic IDs for headings with duplicate handling
 */
function generateHeadingId(text: string, existingIds: Set<string>): string {
  let baseId = slugify(text);
  let finalId = baseId;
  let counter = 2;

  while (existingIds.has(finalId)) {
    finalId = `${baseId}-${counter}`;
    counter++;
  }

  existingIds.add(finalId);
  return finalId;
}

/**
 * Extract headings (h2 and h3 only) from Lexical rich text content
 * Returns headings with stable, unique IDs
 */
export function extractHeadings(
  content: SerializedEditorState | null | undefined
): Heading[] {
  if (!content) return [];

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

  if (!rootNode || !rootNode.children || !Array.isArray(rootNode.children)) {
    return [];
  }

  const headings: Heading[] = [];
  const usedIds = new Set<string>();

  function traverse(node: LexicalNode) {
    if (node.type === "heading") {
      const headingLevel = parseInt(node.tag?.replace("h", "") || "1");
      // Only include h2 and h3
      if (headingLevel === 2 || headingLevel === 3) {
        const text = extractTextFromNode(node);
        if (text) {
          const id = generateHeadingId(text, usedIds);
          headings.push({
            id,
            text,
            level: headingLevel,
          });
        }
      }
    }

    if (node.children) {
      node.children.forEach((child) => traverse(child));
    }
  }

  rootNode.children.forEach((node) => traverse(node as LexicalNode));
  return headings;
}
