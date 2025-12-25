"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { RichTextRenderer } from "@/components/content/RichTextRenderer";
import { Prose } from "@/components/content/Prose";
import { AnimatedExample } from "@/components/animated-examples/AnimatedExample";
import { TableOfContents } from "@/components/ui/TableOfContents";
import { TopicNavigation } from "@/components/ui/TopicNavigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionPrefs } from "@/components/motion/MotionPrefsProvider";
import type {
  CurriculumModule,
  AnimatedExample as AnimatedExampleType,
} from "@/lib/types";

interface ModulePageClientProps {
  module: CurriculumModule;
  prevModule?: { title: string; slug: string } | null;
  nextModule?: { title: string; slug: string } | null;
}

export function ModulePageClient({
  module,
  prevModule,
  nextModule,
}: ModulePageClientProps) {
  const [isRightRailOpen, setIsRightRailOpen] = useState(false);
  const { reduced } = useMotionPrefs();

  // Build TOC from sections and their richText content
  const tocContent = useMemo(() => {
    // Create a mock richText structure for TOC generation
    // TOC component expects a richText structure
    if (!module.sections || module.sections.length === 0) return null;

    return {
      root: {
        type: "root",
        version: 1,
        direction: "ltr" as const,
        format: "",
        indent: 0,
        children: module.sections.map((section) => ({
          type: "heading",
          version: 1,
          tag: "h2",
          format: "",
          indent: 0,
          direction: "ltr" as const,
          children: [
            {
              type: "text",
              text: section.heading,
              format: 0,
              style: "",
              mode: "normal",
              version: 1,
            },
          ],
        })),
      },
    } as any; // Type assertion needed for mock TOC structure
  }, [module.sections]);

  // Extract examples from embeddedExamples (already resolved by server)
  const examplesMap = useMemo(() => {
    const map = new Map<string, AnimatedExampleType>();
    if (module.sections) {
      module.sections.forEach((section) => {
        if (section.embeddedExamples) {
          section.embeddedExamples.forEach((emb: any) => {
            const example =
              typeof emb.exampleId === "object" && emb.exampleId?.exampleId
                ? emb.exampleId
                : typeof emb.exampleId === "string"
                  ? null // Should have been resolved by server
                  : emb.exampleId;
            if (example && example.exampleId) {
              map.set(example.exampleId, example);
            }
          });
        }
      });
    }
    return map;
  }, [module.sections]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 xl:gap-8">
      {/* Main Column: Content Area */}
      <main className="min-w-0 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
              Module {module.order || "?"}
            </span>
            {module.readingTimeMins && (
              <span className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
                {module.readingTimeMins} min read
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            {module.title}
          </h1>
          {module.summary && (
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              {module.summary}
            </p>
          )}
        </div>

        {/* Sections */}
        {module.sections && module.sections.length > 0 ? (
          <div className="space-y-8">
            {module.sections.map((section, index) => {
              const sectionId = `section-${section.key || index}`;

              return (
                <section
                  key={section.key || index}
                  id={sectionId}
                  className="scroll-mt-24"
                >
                  <h2 className="text-3xl font-bold mb-4">{section.heading}</h2>

                  {/* Body content */}
                  {section.body && (
                    <Prose>
                      <RichTextRenderer content={section.body} />
                    </Prose>
                  )}

                  {/* Callouts */}
                  {section.callouts && section.callouts.length > 0 && (
                    <div className="mt-6 space-y-4">
                      {section.callouts.map((callout, calloutIndex) => {
                        const calloutStyles = {
                          whyItMatters:
                            "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                          heuristic:
                            "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                          failureMode:
                            "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
                          checklist:
                            "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
                        };

                        return (
                          <div
                            key={calloutIndex}
                            className={`p-4 rounded-lg border ${calloutStyles[callout.type] || "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"}`}
                          >
                            <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                              {callout.title}
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                              {callout.body}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Embedded Examples */}
                  {section.embeddedExamples &&
                    section.embeddedExamples.length > 0 && (
                      <div className="mt-8 space-y-6">
                        {section.embeddedExamples.map(
                          (embedded: any, exampleIndex: number) => {
                            // Extract example from relationship (already resolved by server)
                            const example =
                              typeof embedded.exampleId === "object" &&
                              embedded.exampleId?.exampleId
                                ? embedded.exampleId
                                : typeof embedded.exampleId === "string"
                                  ? examplesMap.get(embedded.exampleId) || null
                                  : embedded.exampleId;

                            if (!example) {
                              if (process.env.NODE_ENV === "development") {
                                return (
                                  <div
                                    key={exampleIndex}
                                    className="p-4 border border-yellow-300 dark:border-yellow-700 rounded bg-yellow-50 dark:bg-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-200"
                                  >
                                    Example not found:{" "}
                                    {typeof embedded.exampleId === "string"
                                      ? embedded.exampleId
                                      : embedded.exampleId?.id || "unknown"}
                                  </div>
                                );
                              }
                              return null;
                            }

                            return (
                              <AnimatedExample
                                key={example.exampleId || exampleIndex}
                                exampleId={example.exampleId}
                                kind={example.kind}
                                title={example.title}
                                description={example.description}
                                whatToNotice={
                                  example.whatToNotice?.map((item: any) =>
                                    typeof item === "string" ? item : item.item
                                  ) || []
                                }
                                spec={example.spec}
                                controls={example.controls}
                              />
                            );
                          }
                        )}
                      </div>
                    )}
                </section>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Module content not found"
            description="This module is missing sections in CMS. Seed or edit it in Payload."
            adminHint="Admin: Add sections via /admin → Curriculum Modules → [This Module] → Sections field"
          />
        )}

        <TopicNavigation
          prevTopic={prevModule || undefined}
          nextTopic={nextModule || undefined}
        />

        {/* Mobile Right Rail Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsRightRailOpen(!isRightRailOpen)}
            className="w-full flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-sm font-medium">Table of Contents</span>
            {isRightRailOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <AnimatePresence>
            {isRightRailOpen && (
              <motion.div
                initial={reduced ? {} : { height: 0, opacity: 0 }}
                animate={reduced ? {} : { height: "auto", opacity: 1 }}
                exit={reduced ? {} : { height: 0, opacity: 0 }}
                transition={reduced ? {} : { duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
                  <TableOfContents content={tocContent} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Right Rail: Table of Contents (Desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <TableOfContents content={tocContent} />
        </div>
      </aside>
    </div>
  );
}
