"use client";

import { validateSpec } from "@/modules/animatedExamples/specSchema";
import { Timeline2DExample } from "./Timeline2DExample";
import { Flow2DExample } from "./Flow2DExample";
import { Diff2DExample } from "./Diff2DExample";

interface AnimatedExampleProps {
  exampleId: string;
  kind: "timeline2d" | "flow2d" | "diff2d";
  title: string;
  description: string;
  whatToNotice: string[];
  spec: unknown; // JSON from CMS
  controls?: {
    mode: "stepper" | "toggle" | "play";
    initialStep?: number;
    toggleLabels?: string[];
  };
}

export function AnimatedExample({
  exampleId,
  kind,
  title,
  description,
  whatToNotice,
  spec,
  controls,
}: AnimatedExampleProps) {
  const validation = validateSpec(kind, spec);

  if (!validation.success) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="my-4 p-3 border border-red-300 dark:border-red-700 rounded bg-red-50 dark:bg-red-900/20 text-sm text-red-800 dark:text-red-200">
          <strong>Invalid spec for {exampleId}:</strong> {validation.error}
        </div>
      );
    }
    return null;
  }

  switch (kind) {
    case "timeline2d":
      if (validation.data && "lanes" in validation.data) {
        return (
          <Timeline2DExample
            spec={validation.data}
            title={title}
            description={description}
            whatToNotice={whatToNotice}
            controls={controls}
          />
        );
      }
      return null;
    case "flow2d":
      if (validation.data && "nodes" in validation.data) {
        return (
          <Flow2DExample
            spec={validation.data}
            title={title}
            description={description}
            whatToNotice={whatToNotice}
            controls={controls}
          />
        );
      }
      return null;
    case "diff2d":
      if (validation.data && "leftTitle" in validation.data) {
        return (
          <Diff2DExample
            spec={validation.data}
            title={title}
            description={description}
            whatToNotice={whatToNotice}
            controls={controls}
          />
        );
      }
      return null;
    default:
      return null;
  }
}
