"use client";

import { useState } from "react";
import { RichTextRenderer } from "@/components/RichTextRenderer";
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
import { motion } from "framer-motion";
import { demoConfigSchema } from "@/components/demo/demoSchema";
import { Prose } from "@/components/ui/Prose";
import { TableOfContents } from "@/components/ui/TableOfContents";
import { TopicNavigation } from "@/components/ui/TopicNavigation";
import { EmptyState } from "@/components/ui/EmptyState";

type Topic = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  theory?: any;
  references?: Array<{
    label: string;
    url: string;
    note?: string;
    claimIds?: string;
  }>;
  practiceDemo?: any;
  practiceSteps?: Array<{
    title: string;
    body: string;
    focusTarget?: string;
  }>;
  practiceTasks?: Array<{
    prompt: string;
    expectedAnswer: string;
    explanation: string;
  }>;
};

interface TopicPageClientProps {
  topic: Topic;
  prevTopic?: { title: string; slug: string } | null;
  nextTopic?: { title: string; slug: string } | null;
}

export function TopicPageClient({
  topic,
  prevTopic,
  nextTopic,
}: TopicPageClientProps) {
  const [activeTab, setActiveTab] = useState<"theory" | "practice">("theory");
  const [currentStep, setCurrentStep] = useState(0);
  const [taskAnswers, setTaskAnswers] = useState<Record<number, string>>({});
  const [taskRevealed, setTaskRevealed] = useState<Record<number, boolean>>({});
  const [showTOC, setShowTOC] = useState(false);
  const { reduced } = useMotionPrefs();

  const handleTaskSubmit = (index: number, answer: string) => {
    setTaskAnswers((prev) => ({ ...prev, [index]: answer }));
    setTaskRevealed((prev) => ({ ...prev, [index]: true }));
  };

  const currentFocusTarget =
    activeTab === "practice" && topic.practiceSteps?.[currentStep]?.focusTarget
      ? topic.practiceSteps[currentStep].focusTarget
      : null;

  return (
    <article className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-4xl font-bold mb-3">{topic.title}</h1>
        {topic.summary && (
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {topic.summary}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("theory")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "theory"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Theory
          </button>
          <button
            onClick={() => setActiveTab("practice")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "practice"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
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
      >
        {activeTab === "theory" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8">
            <div className="space-y-8 min-w-0">
              {topic.theory ? (
                <Prose>
                  <RichTextRenderer content={topic.theory} />
                </Prose>
              ) : (
                <EmptyState
                  title="Theory content not available"
                  description="Theory content will be added soon."
                />
              )}

              {/* References */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
                <h2 className="text-2xl font-bold mb-4">References</h2>
                {topic.references && topic.references.length > 0 ? (
                  <ul className="space-y-3">
                    {topic.references.map((ref, i) => (
                      <li key={i} className="text-sm">
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          {ref.label}
                        </a>
                        {ref.note && (
                          <span className="text-gray-600 dark:text-gray-400 ml-2">
                            — {ref.note}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic text-sm">
                    References not added yet.
                  </p>
                )}
              </div>

              <TopicNavigation
                prevTopic={prevTopic || undefined}
                nextTopic={nextTopic || undefined}
              />
            </div>

            {/* Table of Contents - Desktop */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <TableOfContents content={topic.theory} />
              </div>
            </aside>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Demo */}
            {topic.practiceDemo &&
              (() => {
                // Determine demo type
                const demoTypeResult = demoConfigSchema.safeParse(
                  topic.practiceDemo
                );
                if (!demoTypeResult.success) {
                  return (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <p>Demo unavailable: Invalid configuration</p>
                    </div>
                  );
                }

                const demoType = demoTypeResult.data.demoType;

                if (demoType === "requirementsToArchitecture") {
                  return (
                    <Spotlight targetId={currentFocusTarget}>
                      <RequirementsToArchitectureDemo
                        demoConfig={topic.practiceDemo}
                        focusTarget={currentFocusTarget || undefined}
                      />
                    </Spotlight>
                  );
                }

                if (demoType === "renderingStrategyLab") {
                  return (
                    <Spotlight targetId={currentFocusTarget}>
                      <RenderingStrategyLabDemo
                        demoConfig={topic.practiceDemo}
                        focusTarget={currentFocusTarget || undefined}
                      />
                    </Spotlight>
                  );
                }

                if (demoType === "stateAtScaleLab") {
                  return (
                    <Spotlight targetId={currentFocusTarget}>
                      <StateAtScaleLabDemo
                        demoConfig={topic.practiceDemo}
                        focusTarget={currentFocusTarget || undefined}
                      />
                    </Spotlight>
                  );
                }

                if (demoType === "performanceBudgetLab") {
                  return (
                    <Spotlight targetId={currentFocusTarget}>
                      <PerformanceBudgetLabDemo
                        demoConfig={topic.practiceDemo}
                        focusTarget={currentFocusTarget || undefined}
                      />
                    </Spotlight>
                  );
                }

                if (demoType === "uiArchitectureLab") {
                  return (
                    <Spotlight targetId={currentFocusTarget}>
                      <UIArchitectureLabDemo
                        demoConfig={topic.practiceDemo}
                        focusTarget={currentFocusTarget || undefined}
                      />
                    </Spotlight>
                  );
                }

                if (demoType === "releaseDeliveryLab") {
                  return (
                    <Spotlight targetId={currentFocusTarget}>
                      <ReleaseDeliveryLabDemo
                        demoConfig={topic.practiceDemo}
                        focusTarget={currentFocusTarget || undefined}
                      />
                    </Spotlight>
                  );
                }

                if (demoType === "testingStrategyLab") {
                  return (
                    <Spotlight targetId={currentFocusTarget}>
                      <TestingStrategyLabDemo
                        demoConfig={topic.practiceDemo}
                        focusTarget={currentFocusTarget || undefined}
                      />
                    </Spotlight>
                  );
                }

                if (demoType === "observabilityLab") {
                  return (
                    <Spotlight targetId={currentFocusTarget}>
                      <ObservabilityLabDemo
                        demoConfig={topic.practiceDemo}
                        focusTarget={currentFocusTarget || undefined}
                      />
                    </Spotlight>
                  );
                }

                if (demoType === "securityPrivacyLab") {
                  return (
                    <Spotlight targetId={currentFocusTarget}>
                      <SecurityPrivacyLabDemo
                        demoConfig={topic.practiceDemo}
                        focusTarget={currentFocusTarget || undefined}
                      />
                    </Spotlight>
                  );
                }

                if (demoType === "realtimeSystemsLab") {
                  return (
                    <Spotlight targetId={currentFocusTarget}>
                      <RealtimeSystemsLabDemo
                        demoConfig={topic.practiceDemo}
                        focusTarget={currentFocusTarget || undefined}
                      />
                    </Spotlight>
                  );
                }

                if (demoType === "largeScaleUXLab") {
                  return (
                    <Spotlight targetId={currentFocusTarget}>
                      <LargeScaleUXLabDemo
                        demoConfig={topic.practiceDemo}
                        focusTarget={currentFocusTarget || undefined}
                      />
                    </Spotlight>
                  );
                }

                if (demoType === "capstoneBuilder") {
                  return (
                    <Spotlight targetId={currentFocusTarget}>
                      <CapstoneBuilderDemo
                        demoConfig={topic.practiceDemo}
                        focusTarget={currentFocusTarget || undefined}
                      />
                    </Spotlight>
                  );
                }

                return (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <p>Demo unavailable: Unknown demo type</p>
                  </div>
                );
              })()}

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
      </motion.div>
    </article>
  );
}
