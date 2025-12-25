import type { Topic as PayloadTopic } from "../../payload-types";
import type { SerializedEditorState } from "lexical";

// Shared Topic type for client components (serialized from Payload)
export type Topic = {
  id: string;
  title: string;
  slug: string;
  order: number;
  summary?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced" | null;
  theory?: SerializedEditorState | null;
  references?: Array<{
    label: string;
    url: string;
    note?: string | null;
    claimIds?: string | null;
  }> | null;
  practiceDemo?: unknown; // JSON field - validated by Zod schema
  practiceSteps?: Array<{
    title: string;
    body: string;
    focusTarget?: string | null;
  }> | null;
  practiceTasks?: Array<{
    prompt: string;
    expectedAnswer: string;
    explanation: string;
  }> | null;
};

// Minimal topic type for navigation/lists
export type TopicListItem = {
  id: string;
  title: string;
  slug: string;
  order: number;
  summary?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced" | null;
};

// Server-side topic type (from Payload)
export type ServerTopic = PayloadTopic;

// Lexical node types for RichTextRenderer
export interface LexicalNode {
  type: string;
  children?: LexicalNode[];
  text?: string;
  tag?: string;
  format?: number;
  url?: string;
  listType?: "number" | "bullet";
}
