"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight, SpotlightTarget } from "../Spotlight";
import {
  uiArchitectureLabConfigSchema,
  type UIArchitectureLabConfig,
  type TokenSet,
} from "../demoSchema";
import { TokenDiff } from "../TokenDiff";
import { MFBoundaryMap } from "../MFBoundaryMap";
import { FederationGraph } from "../FederationGraph";
import { ThreeCanvasShell } from "../../three/ThreeCanvasShell";
import { Fallback2D } from "../../three/Fallback2D";
import { UIArchitectureAtlasScene } from "../../three/UIArchitectureAtlasScene";

interface UIArchitectureLabDemoProps {
  demoConfig: unknown;
  focusTarget?: string | null;
}

type Mode = "TOKENS" | "MICROFRONTENDS" | "MODULE_FEDERATION";

export function UIArchitectureLabDemo({
  demoConfig,
  focusTarget,
}: UIArchitectureLabDemoProps) {
  const { reduced } = useMotionPrefs();
  const [mode, setMode] = useState<Mode>("TOKENS");
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);

  // Token mode state
  const [tokenSetName, setTokenSetName] = useState<string>("");
  const [showTokenDiff, setShowTokenDiff] = useState(false);
  const [previousTokenSet, setPreviousTokenSet] = useState<TokenSet | null>(
    null
  );

  // Micro-frontends mode state
  const [integrationType, setIntegrationType] = useState<
    "ROUTE_BASED" | "COMPONENT_BASED"
  >("ROUTE_BASED");
  const [sharedUI, setSharedUI] = useState(false);
  const [strictContractChecking, setStrictContractChecking] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | undefined>();
  const [selectedComponent, setSelectedComponent] = useState<
    string | undefined
  >();

  // Module Federation mode state
  const [sharedDepsSingleton, setSharedDepsSingleton] = useState(true);
  const [sharedDepsStrictVersion, setSharedDepsStrictVersion] = useState(false);
  const [network, setNetwork] = useState<"FAST" | "SLOW">("FAST");
  const [preloadRemotes, setPreloadRemotes] = useState(false);

  // Validate and parse demo config
  const config = useMemo(() => {
    try {
      return uiArchitectureLabConfigSchema.parse(demoConfig);
    } catch (error) {
      console.error("Invalid demo config:", error);
      return null;
    }
  }, [demoConfig]);

  // Initialize defaults
  useEffect(() => {
    if (config?.defaults) {
      setMode(config.defaults.mode);
      if (config.defaults.tokenSetName)
        setTokenSetName(config.defaults.tokenSetName);
      if (config.defaults.showTokenDiff !== undefined)
        setShowTokenDiff(config.defaults.showTokenDiff);
      if (config.defaults.integrationType)
        setIntegrationType(config.defaults.integrationType);
      if (config.defaults.sharedUI !== undefined)
        setSharedUI(config.defaults.sharedUI);
      if (config.defaults.strictContractChecking !== undefined)
        setStrictContractChecking(config.defaults.strictContractChecking);
      if (config.defaults.sharedDepsSingleton !== undefined)
        setSharedDepsSingleton(config.defaults.sharedDepsSingleton);
      if (config.defaults.sharedDepsStrictVersion !== undefined)
        setSharedDepsStrictVersion(config.defaults.sharedDepsStrictVersion);
      if (config.defaults.network) setNetwork(config.defaults.network);
      if (config.defaults.preloadRemotes !== undefined)
        setPreloadRemotes(config.defaults.preloadRemotes);
    }
  }, [config]);

  // Get current token set
  const currentTokenSet = useMemo(() => {
    if (!config?.tokens || !tokenSetName) return null;
    return (
      config.tokens.tokenSets.find((ts) => ts.name === tokenSetName) || null
    );
  }, [config, tokenSetName]);

  // Handle token set change with animation trigger
  const handleTokenSetChange = useCallback(
    (newSetName: string) => {
      if (currentTokenSet) {
        setPreviousTokenSet(currentTokenSet);
      }
      setTokenSetName(newSetName);

      const newTokenSet = config?.tokens?.tokenSets.find(
        (ts) => ts.name === newSetName
      );
      if (newTokenSet && currentTokenSet) {
        // Find changed tokens
        const changedTokens: string[] = [];
        const checkTokens = (
          oldObj: Record<string, unknown>,
          newObj: Record<string, unknown>,
          path: string = ""
        ) => {
          Object.keys(oldObj).forEach((key) => {
            const newPath = path ? `${path}.${key}` : key;
            if (
              typeof oldObj[key] === "object" &&
              oldObj[key] !== null &&
              typeof newObj[key] === "object" &&
              newObj[key] !== null
            ) {
              checkTokens(
                oldObj[key] as Record<string, unknown>,
                newObj[key] as Record<string, unknown>,
                newPath
              );
            } else if (oldObj[key] !== newObj[key]) {
              changedTokens.push(newPath);
            }
          });
        };
        checkTokens(currentTokenSet.tokens, newTokenSet.tokens);

        const newEntry: EventLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          cause: `Token set changed: ${currentTokenSet.name} → ${newSetName}`,
          decision: `Updated design tokens across system`,
          explanation: `Changed tokens: ${changedTokens.join(", ") || "none"}. Components update automatically via token propagation.`,
        };
        setEventLog((prev) => [...prev, newEntry]);
      }
    },
    [config, currentTokenSet]
  );

  // Get matching Module Federation rule
  const moduleFederationRule = useMemo(() => {
    if (!config?.moduleFederation) return null;
    return (
      config.moduleFederation.rules.find((rule) => {
        if (
          rule.sharedDepsSingleton !== undefined &&
          rule.sharedDepsSingleton !== sharedDepsSingleton
        )
          return false;
        if (
          rule.sharedDepsStrictVersion !== undefined &&
          rule.sharedDepsStrictVersion !== sharedDepsStrictVersion
        )
          return false;
        if (rule.network !== undefined && rule.network !== network)
          return false;
        if (
          rule.preloadRemotes !== undefined &&
          rule.preloadRemotes !== preloadRemotes
        )
          return false;
        return true;
      }) || config.moduleFederation.rules[0]
    );
  }, [
    config,
    sharedDepsSingleton,
    sharedDepsStrictVersion,
    network,
    preloadRemotes,
  ]);

  // Handle Module Federation changes
  useEffect(() => {
    if (mode === "MODULE_FEDERATION" && moduleFederationRule) {
      const newEntry: EventLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        cause: `MF config: singleton=${sharedDepsSingleton}, strictVersion=${sharedDepsStrictVersion}, network=${network}`,
        decision: `Bundle: ${moduleFederationRule.estimatedBundleKb.host}KB host + ${Object.values(moduleFederationRule.estimatedBundleKb.remotes).reduce((a, b) => a + b, 0)}KB remotes`,
        explanation: `Duplication: ${moduleFederationRule.duplicationKb.toFixed(1)}KB. ${moduleFederationRule.pitfalls.join(" ")}`,
      };
      setEventLog((prev) => {
        // Avoid duplicate entries on mount
        if (prev.length > 0 && prev[prev.length - 1].cause === newEntry.cause) {
          return prev;
        }
        return [...prev, newEntry];
      });
    }
  }, [
    mode,
    moduleFederationRule,
    sharedDepsSingleton,
    sharedDepsStrictVersion,
    network,
  ]);

  // Handle Micro-frontends changes
  useEffect(() => {
    if (mode === "MICROFRONTENDS" && config?.microfrontends) {
      const risks = config.microfrontends.riskNotes;
      const newEntry: EventLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        cause: `MFE config: ${integrationType}, sharedUI=${sharedUI}, strictContracts=${strictContractChecking}`,
        decision: `Integration approach: ${integrationType}`,
        explanation: risks.join(" "),
      };
      setEventLog((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].cause === newEntry.cause) {
          return prev;
        }
        return [...prev, newEntry];
      });
    }
  }, [mode, integrationType, sharedUI, strictContractChecking, config]);

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Demo unavailable: Invalid configuration</p>
      </div>
    );
  }

  // Render Design System Preview for TOKENS mode
  const renderDesignSystemPreview = () => {
    if (!currentTokenSet) return null;

    const tokens = currentTokenSet.tokens;
    const style = {
      backgroundColor: tokens.color.bg,
      color: tokens.color.fg,
      accentColor: tokens.color.accent,
      borderRadius: tokens.radius.md,
      padding: tokens.space["2"],
      fontSize: tokens.font.size.md,
    };

    return (
      <div
        className="space-y-4"
        style={{ ...style, border: `1px solid ${tokens.color.fg}20` }}
      >
        <h4 className="text-sm font-semibold mb-4">Design System Preview</h4>
        <div className="space-y-3">
          {/* Button */}
          <motion.button
            whileHover={reduced ? {} : { scale: 1.02 }}
            className="px-4 py-2 rounded"
            style={{
              backgroundColor: tokens.color.accent,
              color: tokens.color.bg,
              borderRadius: tokens.radius.md,
            }}
          >
            Button
          </motion.button>

          {/* Card */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={reduced ? {} : { opacity: 1, y: 0 }}
            transition={reduced ? {} : { duration: 0.3 }}
            className="p-4 rounded"
            style={{
              backgroundColor: tokens.color.bg,
              border: `1px solid ${tokens.color.fg}30`,
              borderRadius: tokens.radius.lg,
              padding: tokens.space["3"],
            }}
          >
            <div className="font-semibold mb-2">Card Component</div>
            <div className="text-sm" style={{ color: tokens.color.fg + "CC" }}>
              Content using design tokens
            </div>
          </motion.div>

          {/* Input */}
          <input
            type="text"
            placeholder="Input field"
            className="px-3 py-2 rounded border w-full"
            style={{
              borderRadius: tokens.radius.sm,
              padding: tokens.space["1"],
              fontSize: tokens.font.size.sm,
            }}
          />

          {/* Badge */}
          <span
            className="inline-block px-2 py-1 rounded"
            style={{
              backgroundColor: tokens.color.accent + "20",
              color: tokens.color.accent,
              borderRadius: tokens.radius.sm,
              fontSize: tokens.font.size.sm,
            }}
          >
            Badge
          </span>
        </div>
      </div>
    );
  };

  // Handle play load for federation mode
  const handlePlayLoad = useCallback(() => {
    if (
      moduleFederationRule &&
      moduleFederationRule.loadOrderEvents.length > 0
    ) {
      const newEntry: EventLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        cause: "Play load order animation",
        decision: "Module Federation load sequence",
        explanation: moduleFederationRule.loadOrderEvents.join(" → "),
      };
      setEventLog((prev) => [...prev, newEntry]);
    }
  }, [moduleFederationRule]);

  // Controls based on mode
  const controls = (
    <div className="space-y-4">
      {/* View mode toggle (2D/3D) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          View Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("2D")}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
              viewMode === "2D"
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            2D
          </button>
          <button
            onClick={() => setViewMode("3D")}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
              viewMode === "3D"
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            3D
          </button>
        </div>
      </div>

      {/* Mode selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Mode
        </label>
        <div className="flex gap-2">
          {(["TOKENS", "MICROFRONTENDS", "MODULE_FEDERATION"] as Mode[]).map(
            (m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                  mode === m
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {m === "TOKENS"
                  ? "Tokens"
                  : m === "MICROFRONTENDS"
                    ? "Micro-frontends"
                    : "Module Fed"}
              </button>
            )
          )}
        </div>
      </div>

      {/* Mode-specific controls */}
      {mode === "TOKENS" && config.tokens && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Theme/Token Set
            </label>
            <select
              value={tokenSetName}
              onChange={(e) => handleTokenSetChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {config.tokens.tokenSets.map((ts) => (
                <option key={ts.name} value={ts.name}>
                  {ts.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showDiff"
              checked={showTokenDiff}
              onChange={(e) => setShowTokenDiff(e.target.checked)}
              className="w-4 h-4"
            />
            <label
              htmlFor="showDiff"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Show token diff
            </label>
          </div>
        </>
      )}

      {mode === "MICROFRONTENDS" && config.microfrontends && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Integration Type
            </label>
            <select
              value={integrationType}
              onChange={(e) =>
                setIntegrationType(
                  e.target.value as "ROUTE_BASED" | "COMPONENT_BASED"
                )
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ROUTE_BASED">Route-based</option>
              <option value="COMPONENT_BASED">Component-based</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sharedUI"
              checked={sharedUI}
              onChange={(e) => setSharedUI(e.target.checked)}
              className="w-4 h-4"
            />
            <label
              htmlFor="sharedUI"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Shared UI library
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="strictContracts"
              checked={strictContractChecking}
              onChange={(e) => setStrictContractChecking(e.target.checked)}
              className="w-4 h-4"
            />
            <label
              htmlFor="strictContracts"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Strict contract checking
            </label>
          </div>
        </>
      )}

      {mode === "MODULE_FEDERATION" && config.moduleFederation && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="singleton"
              checked={sharedDepsSingleton}
              onChange={(e) => setSharedDepsSingleton(e.target.checked)}
              className="w-4 h-4"
            />
            <label
              htmlFor="singleton"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Shared deps singleton
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="strictVersion"
              checked={sharedDepsStrictVersion}
              onChange={(e) => setSharedDepsStrictVersion(e.target.checked)}
              className="w-4 h-4"
            />
            <label
              htmlFor="strictVersion"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Strict version
            </label>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Network
            </label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as "FAST" | "SLOW")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FAST">Fast</option>
              <option value="SLOW">Slow</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="preload"
              checked={preloadRemotes}
              onChange={(e) => setPreloadRemotes(e.target.checked)}
              className="w-4 h-4"
            />
            <label
              htmlFor="preload"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Preload remotes
            </label>
          </div>
        </>
      )}
    </div>
  );

  // 2D Visualization
  const visualization2D = (
    <Spotlight targetId={focusTarget || null}>
      <div className="space-y-6">
        {mode === "TOKENS" && config.tokens && (
          <>
            <SpotlightTarget id="tokens.preview" className="space-y-4">
              {currentTokenSet && renderDesignSystemPreview()}
            </SpotlightTarget>
            {showTokenDiff && previousTokenSet && currentTokenSet && (
              <SpotlightTarget id="tokens.diff" className="space-y-4">
                <TokenDiff
                  oldTokens={previousTokenSet}
                  newTokens={currentTokenSet}
                  highlightPaths={config.tokens.diffRules.map(
                    (r) => r.tokenPath
                  )}
                />
              </SpotlightTarget>
            )}
          </>
        )}

        {mode === "MICROFRONTENDS" && config.microfrontends && (
          <SpotlightTarget id="mfe.map" className="space-y-4">
            <MFBoundaryMap
              mfes={config.microfrontends.mfes}
              selectedRoute={selectedRoute}
              selectedComponent={selectedComponent}
              integrationType={integrationType}
              onRouteClick={(route) => {
                setSelectedRoute(route);
                setSelectedComponent(undefined);
              }}
              onComponentClick={(component) => {
                setSelectedComponent(component);
                setSelectedRoute(undefined);
              }}
            />
          </SpotlightTarget>
        )}

        {mode === "MODULE_FEDERATION" &&
          config.moduleFederation &&
          moduleFederationRule && (
            <SpotlightTarget id="mf.graph" className="space-y-4">
              <FederationGraph
                remotes={config.moduleFederation.remotes}
                sharedDeps={config.moduleFederation.sharedDeps}
                duplicationKb={moduleFederationRule.duplicationKb}
                loadOrderEvents={moduleFederationRule.loadOrderEvents}
                network={network}
                preloadRemotes={preloadRemotes}
              />
            </SpotlightTarget>
          )}
      </div>
    </Spotlight>
  );

  // 3D Visualization
  const visualization3D = (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
      <ThreeCanvasShell
        className="w-full h-full"
        fallback={
          <Fallback2D message="3D unavailable, showing 2D view">
            {visualization2D}
          </Fallback2D>
        }
      >
        <UIArchitectureAtlasScene
          mode={mode}
          config={config}
          currentTokenSet={currentTokenSet}
          previousTokenSet={previousTokenSet}
          showTokenDiff={showTokenDiff}
          integrationType={integrationType}
          sharedUI={sharedUI}
          selectedRoute={selectedRoute}
          selectedComponent={selectedComponent}
          sharedDepsSingleton={sharedDepsSingleton}
          sharedDepsStrictVersion={sharedDepsStrictVersion}
          duplicationKb={moduleFederationRule?.duplicationKb}
          loadOrderEvents={moduleFederationRule?.loadOrderEvents || []}
          network={network}
          preloadRemotes={preloadRemotes}
          onPlayLoad={handlePlayLoad}
          focusTarget={focusTarget}
        />
      </ThreeCanvasShell>
    </div>
  );

  // Choose visualization based on view mode
  const visualization = viewMode === "3D" ? visualization3D : visualization2D;

  return (
    <DemoShell
      controls={controls}
      visualization={visualization}
      eventLog={<EventLog entries={eventLog} />}
    />
  );
}
