"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RichTextRenderer } from "@/components/content/RichTextRenderer";
import { Prose } from "@/components/content/Prose";
import { AnimatedExplanationBlocks } from "@/components/theory/AnimatedExplanationBlocks";
import { RequirementsToArchitectureDemo } from "@/components/demo/demos/RequirementsToArchitectureDemo";
import { RenderingStrategyLabDemo } from "@/components/demo/demos/RenderingStrategyLabDemo";
import { StateAtScaleLabDemo } from "@/components/demo/demos/StateAtScaleLabDemo";
import { PerformanceBudgetLabDemo } from "@/components/demo/demos/PerformanceBudgetLabDemo";
import { UIArchitectureLabDemo } from "@/components/demo/demos/UIArchitectureLabDemo";
import { ReleaseDeliveryLabDemo } from "@/components/demo/demos/ReleaseDeliveryLabDemo";
import { TestingStrategyLabDemo } from "@/components/demo/demos/TestingStrategyLabDemo";
import { ObservabilityLabDemo } from "@/components/demo/demos/ObservabilityLabDemo";
import { SecurityPrivacyLabDemo } from "@/components/demo/demos/SecurityPrivacyLabDemo";
import { RealtimeSystemsLabDemo } from "@/components/demo/demos/RealtimeSystemsLabDemo";
import { LargeScaleUXLabDemo } from "@/components/demo/demos/LargeScaleUXLabDemo";
import { CapstoneBuilderDemo } from "@/components/demo/demos/CapstoneBuilderDemo";
import { Spotlight } from "@/components/demo/Spotlight";
import { useMotionPrefs } from "@/components/motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { demoConfigSchema } from "@/components/demo/demoSchema";
import { TableOfContents } from "@/components/ui/TableOfContents";
import { TopicNavigation } from "@/components/ui/TopicNavigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronRight, Menu, X, ChevronDown, ChevronUp } from "lucide-react";
import type { Topic } from "@/lib/types";

type TopicListItem = {
  id: string;
  title: string;
  slug: string;
  order: number;
};

interface TopicPageClientProps {
  topic: Topic;
  allTopics: TopicListItem[];
  prevTopic?: { title: string; slug: string } | null;
  nextTopic?: { title: string; slug: string } | null;
}

export function TopicPageClient({
  topic,
  allTopics,
  prevTopic,
  nextTopic,
}: TopicPageClientProps) {
  const [activeTab, setActiveTab] = useState<"theory" | "practice">("theory");
  const [currentStep, setCurrentStep] = useState(0);
  const [taskAnswers, setTaskAnswers] = useState<Record<number, string>>({});
  const [taskRevealed, setTaskRevealed] = useState<Record<number, boolean>>({});
  const [isLeftRailOpen, setIsLeftRailOpen] = useState(false);
  const [isRightRailOpen, setIsRightRailOpen] = useState(false);
  const pathname = usePathname();
  const { reduced } = useMotionPrefs();

  const handleTaskSubmit = (index: number, answer: string) => {
    setTaskAnswers((prev) => ({ ...prev, [index]: answer }));
    setTaskRevealed((prev) => ({ ...prev, [index]: true }));
  };

  const currentFocusTarget =
    activeTab === "practice" && topic.practiceSteps?.[currentStep]?.focusTarget
      ? topic.practiceSteps[currentStep].focusTarget
      : null;

  // Determine demo component
  const renderDemo = () => {
    if (!topic.practiceDemo) return null;

    const demoTypeResult = demoConfigSchema.safeParse(
      topic.practiceDemo as unknown
    );
    if (!demoTypeResult.success) {
      return (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <p>Demo unavailable: Invalid configuration</p>
        </div>
      );
    }

    const demoType = demoTypeResult.data.demoType;
    const demoProps = {
      demoConfig: topic.practiceDemo,
      focusTarget: currentFocusTarget || undefined,
    };

    const demos: Record<string, React.ReactNode> = {
      requirementsToArchitecture: (
        <Spotlight targetId={currentFocusTarget}>
          <RequirementsToArchitectureDemo {...demoProps} />
        </Spotlight>
      ),
      renderingStrategyLab: (
        <Spotlight targetId={currentFocusTarget}>
          <RenderingStrategyLabDemo {...demoProps} />
        </Spotlight>
      ),
      stateAtScaleLab: (
        <Spotlight targetId={currentFocusTarget}>
          <StateAtScaleLabDemo {...demoProps} />
        </Spotlight>
      ),
      performanceBudgetLab: (
        <Spotlight targetId={currentFocusTarget}>
          <PerformanceBudgetLabDemo {...demoProps} />
        </Spotlight>
      ),
      uiArchitectureLab: (
        <Spotlight targetId={currentFocusTarget}>
          <UIArchitectureLabDemo {...demoProps} />
        </Spotlight>
      ),
      releaseDeliveryLab: (
        <Spotlight targetId={currentFocusTarget}>
          <ReleaseDeliveryLabDemo {...demoProps} />
        </Spotlight>
      ),
      testingStrategyLab: (
        <Spotlight targetId={currentFocusTarget}>
          <TestingStrategyLabDemo {...demoProps} />
        </Spotlight>
      ),
      observabilityLab: (
        <Spotlight targetId={currentFocusTarget}>
          <ObservabilityLabDemo {...demoProps} />
        </Spotlight>
      ),
      securityPrivacyLab: (
        <Spotlight targetId={currentFocusTarget}>
          <SecurityPrivacyLabDemo {...demoProps} />
        </Spotlight>
      ),
      realtimeSystemsLab: (
        <Spotlight targetId={currentFocusTarget}>
          <RealtimeSystemsLabDemo {...demoProps} />
        </Spotlight>
      ),
      largeScaleUXLab: (
        <Spotlight targetId={currentFocusTarget}>
          <LargeScaleUXLabDemo {...demoProps} />
        </Spotlight>
      ),
      capstoneBuilder: (
        <Spotlight targetId={currentFocusTarget}>
          <CapstoneBuilderDemo {...demoProps} />
        </Spotlight>
      ),
    };

    return (
      demos[demoType] || (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <p>Demo unavailable: Unknown demo type</p>
        </div>
      )
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,_1fr)_280px] gap-6 xl:gap-8">
      {/* Left Rail: Topic Navigator (Desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <div className="px-2 mb-4">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Topic Navigator
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {allTopics.length} topics
            </p>
          </div>
          <nav className="space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {allTopics.map((t) => {
              const isActive = pathname === `/topics/${t.slug}`;
              return (
                <Link
                  key={t.id}
                  href={`/topics/${t.slug}`}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all group
                    ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <span
                    className={`text-xs font-semibold w-5 text-center ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {t.order}
                  </span>
                  <span className="flex-1 truncate leading-snug">
                    {t.title}
                  </span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Column: Content Area */}
      <main className="min-w-0 space-y-6">
        {/* Mobile Left Rail Toggle (inside main column) */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsLeftRailOpen(!isLeftRailOpen)}
            className="w-full flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-sm font-medium">Topic Navigator</span>
            {isLeftRailOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <AnimatePresence>
            {isLeftRailOpen && (
              <motion.div
                initial={reduced ? {} : { height: 0, opacity: 0 }}
                animate={reduced ? {} : { height: "auto", opacity: 1 }}
                exit={reduced ? {} : { height: 0, opacity: 0 }}
                transition={reduced ? {} : { duration: 0.2 }}
                className="overflow-hidden"
              >
                <nav className="mt-2 space-y-1 p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
                  {allTopics.map((t) => {
                    const isActive = pathname === `/topics/${t.slug}`;
                    return (
                      <Link
                        key={t.id}
                        href={`/topics/${t.slug}`}
                        onClick={() => setIsLeftRailOpen(false)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                          ${
                            isActive
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }
                        `}
                      >
                        <span
                          className={`text-xs font-semibold w-5 text-center ${
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {t.order}
                        </span>
                        <span className="flex-1 truncate">{t.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
              Topic {topic.order || "?"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            {topic.title}
          </h1>
          {topic.summary && (
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              {topic.summary}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex gap-4 sm:gap-6">
            <button
              onClick={() => setActiveTab("theory")}
              className={`px-2 py-3 font-semibold text-sm sm:text-base border-b-2 transition-colors ${
                activeTab === "theory"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Theory
            </button>
            <button
              onClick={() => setActiveTab("practice")}
              className={`px-2 py-3 font-semibold text-sm sm:text-base border-b-2 transition-colors ${
                activeTab === "practice"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Practice
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={reduced ? {} : { opacity: 1, y: 0 }}
          transition={reduced ? {} : { duration: 0.3 }}
          className="space-y-8"
        >
          {activeTab === "theory" ? (
            <>
              {topic.theory &&
              typeof topic.theory === "object" &&
              topic.theory !== null &&
              (("root" in topic.theory &&
                topic.theory.root &&
                typeof topic.theory.root === "object" &&
                "children" in topic.theory.root &&
                Array.isArray(topic.theory.root.children) &&
                topic.theory.root.children.length > 0) ||
                ("children" in topic.theory &&
                  Array.isArray(topic.theory.children) &&
                  topic.theory.children.length > 0)) ? (
                <>
                  <Prose>
                    <RichTextRenderer content={topic.theory} />
                  </Prose>

                  {/* Animated Explanation Blocks */}
                  {topic.theoryAnimations && (
                    <AnimatedExplanationBlocks
                      blocks={topic.theoryAnimations}
                      onPracticeLink={(anchor) => {
                        // Scroll to practice tab and anchor (if implemented)
                        setActiveTab("practice");
                        // Could scroll to specific anchor in practice tab
                      }}
                    />
                  )}
                </>
              ) : (
                <EmptyState
                  title="Theory content not found"
                  description="This topic is missing Theory content in CMS. Seed or edit it in Payload."
                  adminHint="Admin: Add theory content via /admin → Topics → [This Topic] → Theory field"
                />
              )}

              {/* References */}
              {topic.references && topic.references.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-8 space-y-4">
                  <h2 className="text-3xl font-bold">References</h2>
                  <ul className="space-y-4">
                    {topic.references.map((ref, i) => (
                      <li
                        key={i}
                        className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800"
                      >
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-lg"
                        >
                          {ref.label}
                        </a>
                        {ref.note && (
                          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                            {ref.note}
                          </p>
                        )}
                        {ref.claimIds && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Supports: {ref.claimIds}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <TopicNavigation
                prevTopic={prevTopic || undefined}
                nextTopic={nextTopic || undefined}
              />
            </>
          ) : (
            <div className="space-y-8">
              {/* Demo */}
              {renderDemo()}

              {/* Guided Steps */}
              {topic.practiceSteps && topic.practiceSteps.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Guided Steps</h2>
                  <div className="space-y-4">
                    {topic.practiceSteps.map((step, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          index === currentStep
                            ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">
                            Step {index + 1}: {step.title}
                          </h3>
                          <button
                            onClick={() => setCurrentStep(index)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {index === currentStep ? "Current" : "Go to step"}
                          </button>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {step.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hands-on Tasks */}
              {topic.practiceTasks && topic.practiceTasks.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Hands-on Tasks</h2>
                  <div className="space-y-6">
                    {topic.practiceTasks.map((task, index) => (
                      <div
                        key={index}
                        className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <h3 className="font-semibold mb-3">Task {index + 1}</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
                          {task.prompt}
                        </p>
                        <textarea
                          value={taskAnswers[index] || ""}
                          onChange={(e) =>
                            setTaskAnswers((prev) => ({
                              ...prev,
                              [index]: e.target.value,
                            }))
                          }
                          placeholder="Your answer..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-sm mb-4"
                          rows={4}
                        />
                        <button
                          onClick={() =>
                            handleTaskSubmit(index, taskAnswers[index] || "")
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          Check Answer
                        </button>
                        {taskRevealed[index] && (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                            <p className="text-sm font-medium mb-2">
                              Expected Answer:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
                              {task.expectedAnswer}
                            </p>
                            <p className="text-sm font-medium mb-2">
                              Explanation:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                              {task.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <TopicNavigation
                prevTopic={prevTopic || undefined}
                nextTopic={nextTopic || undefined}
              />
            </div>
          )}

          {/* Mobile Right Rail Toggle (inside main column) */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsRightRailOpen(!isRightRailOpen)}
              className="w-full flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm font-medium">
                {activeTab === "theory"
                  ? "Table of Contents"
                  : "What to Observe"}
              </span>
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
                    {activeTab === "theory" ? (
                      <TableOfContents content={topic.theory} />
                    ) : (
                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        {topic.practiceSteps?.[currentStep]?.focusTarget && (
                          <p>
                            <strong>Focus:</strong>{" "}
                            {topic.practiceSteps[currentStep].focusTarget}
                          </p>
                        )}
                        <p>Watch how state changes affect the visualization</p>
                        <p>Check the Event Log for causal explanations</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Right Rail: Context Panel (Desktop) */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-6">
          {activeTab === "theory" ? (
            <>
              <TableOfContents content={topic.theory} />
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wider mb-3">
                  Key Takeaways
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Review the main concepts and design patterns covered in this
                  topic. Use the table of contents above to navigate quickly.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
                  What to Observe
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {topic.practiceSteps?.[currentStep]?.focusTarget && (
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                        •
                      </span>
                      <span>
                        Focus on: {topic.practiceSteps[currentStep].focusTarget}
                      </span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                      •
                    </span>
                    <span>
                      Watch how state changes affect the visualization
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                      •
                    </span>
                    <span>Check the Event Log for causal explanations</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
