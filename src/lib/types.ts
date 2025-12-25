import type { Topic as PayloadTopic } from "../../payload-types";
// Note: CurriculumModule and AnimatedExample types will be available after running payload generate:types
// For now, we define them manually below
import type { SerializedEditorState } from "lexical";

/**
 * @deprecated This type is deprecated. Use CurriculumModule instead.
 * The old topics collection has been replaced by curriculum_modules.
 * This type is kept temporarily for backward compatibility during migration.
 */
export type Topic = {
  id: string;
  title: string;
  slug: string;
  order: number;
  summary?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced" | null;
  theory?: SerializedEditorState | null;
  theoryAnimations?: unknown; // JSON field - validated by Zod schema
  references?: Array<{
    label: string;
    url: string;
    note?: string | null;
    claimIds?: string | null;
  }> | null;
};

// Curriculum Module type (new system)
export type CurriculumModule = {
  id: string;
  order: number;
  slug: string;
  title: string;
  summary: string;
  readingTimeMins?: number | null;
  sections: Array<{
    id?: string | null;
    key: string;
    heading: string;
    kind:
      | "overview"
      | "prerequisites"
      | "mentalModel"
      | "coreConcepts"
      | "designProcess"
      | "tradeoffs"
      | "mistakes"
      | "caseStudy"
      | "interviewQA"
      | "references";
    body: SerializedEditorState;
    callouts?: Array<{
      id?: string | null;
      type: "whyItMatters" | "heuristic" | "failureMode" | "checklist";
      title: string;
      body: string;
    }> | null;
    embeddedExamples?: Array<{
      id?: string | null;
      exampleId: string | AnimatedExample; // Can be relationship or ID string
    }> | null;
  }>;
};

// Animated Example type
export type AnimatedExample = {
  id: string;
  exampleId: string;
  module: string | CurriculumModule;
  title: string;
  placementHint?:
    | "mentalModel"
    | "coreConcepts"
    | "tradeoffs"
    | "caseStudy"
    | null;
  kind: "timeline2d" | "flow2d" | "diff2d";
  description: string;
  controls?: {
    mode: "stepper" | "toggle" | "play";
    initialStep?: number | null;
    toggleLabels?: Array<{
      id?: string;
      label: string;
    }> | null;
  } | null;
  whatToNotice?: Array<{
    id?: string;
    item: string;
  }> | null;
  spec: unknown; // JSON field - validated by Zod schema
};

/**
 * @deprecated This type is deprecated. Use CurriculumModule directly or a simplified inline type.
 */
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
