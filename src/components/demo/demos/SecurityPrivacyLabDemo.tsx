"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useMotionPrefs } from "../../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";
import { DemoShell } from "../DemoShell";
import { EventLog, EventLogEntry } from "../EventLog";
import { Spotlight, SpotlightTarget } from "../Spotlight";
import {
  securityPrivacyLabConfigSchema,
  type SecurityPrivacyLabConfig,
} from "../demoSchema";
import { ThreeCanvasShell } from "../../three/ThreeCanvasShell";
import { SecuritySandboxScene } from "../../three/SecuritySandboxScene";
import { Fallback2D } from "../../three/Fallback2D";

interface SecurityPrivacyLabDemoProps {
  demoConfig: unknown;
  focusTarget?: string | null;
}

type Mode =
  | "XSS_CSRF"
  | "CSP"
  | "TOKEN_STORAGE"
  | "CLICKJACKING"
  | "DEPENDENCIES"
  | "PII";

type Threat = "XSS" | "CSRF";
type SameSite = "NONE" | "LAX" | "STRICT";
type ScriptSrc = "NONE" | "SELF" | "SELF_CDN" | "UNSAFE_INLINE";
type ConnectSrc = "SELF" | "API_ONLY" | "ANY";
type FrameAncestors = "NONE" | "SELF" | "TRUSTED";
type TokenStorage = "HTTP_ONLY_COOKIE" | "LOCAL_STORAGE" | "MEMORY";
type ClickjackingDefense = "NONE" | "XFO_DENY" | "CSP_FRAME_ANCESTORS";
type PIIMode = "RAW" | "REDACTED" | "MINIMIZED";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface DefenseState {
  inputEncoding: boolean;
  sanitizeHtml: boolean;
  sameSite: SameSite;
  csrfToken: boolean;
}

interface CSPState {
  scriptSrc: ScriptSrc;
  connectSrc: ConnectSrc;
  frameAncestors: FrameAncestors;
}

interface Dependency {
  name: string;
  version: string;
  risk: RiskLevel;
}

export function SecurityPrivacyLabDemo({
  demoConfig,
  focusTarget,
}: SecurityPrivacyLabDemoProps) {
  const { reduced } = useMotionPrefs();
  const [mode, setMode] = useState<Mode>("XSS_CSRF");
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [cameraPreset, setCameraPreset] = useState<
    "overview" | "closeup" | "side"
  >("overview");
  const [threat, setThreat] = useState<Threat>("XSS");
  const [defense, setDefense] = useState<DefenseState>({
    inputEncoding: false,
    sanitizeHtml: false,
    sameSite: "NONE",
    csrfToken: false,
  });
  const [csp, setCsp] = useState<CSPState>({
    scriptSrc: "NONE",
    connectSrc: "SELF",
    frameAncestors: "NONE",
  });
  const [tokenStorage, setTokenStorage] =
    useState<TokenStorage>("LOCAL_STORAGE");
  const [refreshFlow, setRefreshFlow] = useState(false);
  const [clickjackingDefense, setClickjackingDefense] =
    useState<ClickjackingDefense>("NONE");
  const [deps, setDeps] = useState<Dependency[]>([]);
  const [piiMode, setPiiMode] = useState<PIIMode>("RAW");
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [evaluatePolicyTrigger, setEvaluatePolicyTrigger] = useState(0);
  const [tryEmbedTrigger, setTryEmbedTrigger] = useState(0);

  // Validate and parse demo config
  const config = useMemo(() => {
    try {
      return securityPrivacyLabConfigSchema.parse(demoConfig);
    } catch (error) {
      console.error("Invalid demo config:", error);
      return null;
    }
  }, [demoConfig]);

  // Initialize defaults
  useEffect(() => {
    if (config?.defaults) {
      setMode(config.defaults.mode);
      if (config.defaults.threat) setThreat(config.defaults.threat);
      if (config.defaults.defense) setDefense(config.defaults.defense);
      if (config.defaults.csp) setCsp(config.defaults.csp);
      if (config.defaults.tokenStorage)
        setTokenStorage(config.defaults.tokenStorage);
      if (config.defaults.refreshFlow !== undefined)
        setRefreshFlow(config.defaults.refreshFlow);
      if (config.defaults.clickjackingDefense)
        setClickjackingDefense(config.defaults.clickjackingDefense);
      if (config.defaults.deps) setDeps(config.defaults.deps);
      if (config.defaults.piiMode) setPiiMode(config.defaults.piiMode);
    }
  }, [config]);

  // Compute allow/block outcomes based on current state
  const allowedOrBlocked = useMemo(() => {
    if (!config) return [];

    const results: Array<{
      action: string;
      result: "ALLOW" | "BLOCK";
      reason: string;
    }> = [];

    if (mode === "XSS_CSRF") {
      if (threat === "XSS") {
        const action = "render user comment";
        if (defense.inputEncoding || defense.sanitizeHtml) {
          results.push({
            action,
            result: "BLOCK",
            reason: defense.sanitizeHtml
              ? "HTML sanitization removes dangerous markup"
              : "Input encoding prevents script execution",
          });
        } else {
          results.push({
            action,
            result: "ALLOW",
            reason: "No XSS defenses enabled - unsafe content may execute",
          });
        }
      } else if (threat === "CSRF") {
        const action = "POST /transfer";
        if (defense.sameSite !== "NONE" || defense.csrfToken) {
          results.push({
            action,
            result: "BLOCK",
            reason:
              defense.sameSite !== "NONE"
                ? `SameSite=${defense.sameSite} blocks cross-site requests`
                : "CSRF token validation blocks unauthorized requests",
          });
        } else {
          results.push({
            action,
            result: "ALLOW",
            reason: "No CSRF defenses - cross-site requests may succeed",
          });
        }
      }
    } else if (mode === "CSP") {
      const actions = [
        { name: "load inline script", src: "UNSAFE_INLINE" },
        { name: "load script from CDN", src: "SELF_CDN" },
        { name: "fetch to api", src: "API_ONLY" },
        { name: "embed in iframe", src: "TRUSTED" },
      ];

      actions.forEach(({ name, src }) => {
        if (name.includes("script")) {
          if (csp.scriptSrc === "NONE") {
            results.push({
              action: name,
              result: "BLOCK",
              reason: "script-src 'none' blocks all scripts",
            });
          } else if (
            name.includes("inline") &&
            csp.scriptSrc !== "UNSAFE_INLINE"
          ) {
            results.push({
              action: name,
              result: "BLOCK",
              reason: `script-src '${csp.scriptSrc.toLowerCase()}' blocks inline scripts`,
            });
          } else if (name.includes("CDN") && csp.scriptSrc === "SELF") {
            results.push({
              action: name,
              result: "BLOCK",
              reason: "script-src 'self' blocks third-party scripts",
            });
          } else {
            results.push({
              action: name,
              result: "ALLOW",
              reason: `script-src policy allows this script source`,
            });
          }
        } else if (name.includes("fetch")) {
          if (csp.connectSrc === "SELF" && src === "API_ONLY") {
            results.push({
              action: name,
              result: "ALLOW",
              reason: "connect-src 'self' allows same-origin API calls",
            });
          } else if (csp.connectSrc === "ANY") {
            results.push({
              action: name,
              result: "ALLOW",
              reason: "connect-src allows all connections",
            });
          } else {
            results.push({
              action: name,
              result: "BLOCK",
              reason: "connect-src policy blocks this connection",
            });
          }
        } else if (name.includes("iframe")) {
          if (csp.frameAncestors === "NONE") {
            results.push({
              action: name,
              result: "BLOCK",
              reason: "frame-ancestors 'none' prevents embedding",
            });
          } else if (csp.frameAncestors === "SELF" && src !== "TRUSTED") {
            results.push({
              action: name,
              result: "BLOCK",
              reason: "frame-ancestors 'self' blocks cross-origin embedding",
            });
          } else {
            results.push({
              action: name,
              result: "ALLOW",
              reason: "frame-ancestors policy allows embedding",
            });
          }
        }
      });
    } else if (mode === "CLICKJACKING") {
      const action = "embed page in iframe";
      if (clickjackingDefense === "NONE") {
        results.push({
          action,
          result: "ALLOW",
          reason: "No clickjacking defense - page can be embedded",
        });
      } else {
        results.push({
          action,
          result: "BLOCK",
          reason:
            clickjackingDefense === "XFO_DENY"
              ? "X-Frame-Options: DENY prevents embedding"
              : "CSP frame-ancestors prevents embedding",
        });
      }
    }

    return results;
  }, [mode, threat, defense, csp, clickjackingDefense, config]);

  // Compute risk summary
  const riskSummary = useMemo(() => {
    if (!config) return { severity: "LOW" as RiskLevel, notes: [] };

    const notes: string[] = [];
    let severity: RiskLevel = "LOW";

    if (mode === "XSS_CSRF") {
      if (threat === "XSS" && !defense.inputEncoding && !defense.sanitizeHtml) {
        severity = "HIGH";
        notes.push("XSS vulnerability: no input encoding or sanitization");
      } else if (
        threat === "CSRF" &&
        defense.sameSite === "NONE" &&
        !defense.csrfToken
      ) {
        severity = "HIGH";
        notes.push("CSRF vulnerability: no SameSite or CSRF token");
      } else {
        severity = "LOW";
        notes.push("Defenses enabled reduce risk");
      }
    } else if (mode === "CSP") {
      if (csp.scriptSrc === "UNSAFE_INLINE") {
        severity = "HIGH";
        notes.push("CSP allows unsafe-inline scripts - XSS risk");
      } else if (csp.connectSrc === "ANY") {
        severity = "MEDIUM";
        notes.push("CSP allows all connections - data exfiltration risk");
      } else {
        severity = "LOW";
        notes.push("Restrictive CSP reduces attack surface");
      }
    } else if (mode === "TOKEN_STORAGE") {
      if (tokenStorage === "LOCAL_STORAGE") {
        severity = "MEDIUM";
        notes.push("localStorage accessible to XSS - token theft risk");
      } else if (tokenStorage === "HTTP_ONLY_COOKIE") {
        severity = "LOW";
        notes.push("HttpOnly cookie not accessible to JavaScript");
      } else {
        severity = "LOW";
        notes.push(
          "Memory storage reduces persistence but requires refresh flow"
        );
      }
    } else if (mode === "CLICKJACKING") {
      if (clickjackingDefense === "NONE") {
        severity = "MEDIUM";
        notes.push("No clickjacking defense - page can be framed");
      } else {
        severity = "LOW";
        notes.push("Clickjacking defense enabled");
      }
    } else if (mode === "DEPENDENCIES") {
      const highRiskDeps = deps.filter((d) => d.risk === "HIGH");
      if (highRiskDeps.length > 0) {
        severity = "HIGH";
        notes.push(`${highRiskDeps.length} high-risk dependencies detected`);
      } else {
        const medRiskDeps = deps.filter((d) => d.risk === "MEDIUM");
        if (medRiskDeps.length > 0) {
          severity = "MEDIUM";
          notes.push(`${medRiskDeps.length} medium-risk dependencies`);
        } else {
          severity = "LOW";
          notes.push("All dependencies are low risk");
        }
      }
    } else if (mode === "PII") {
      if (piiMode === "RAW") {
        severity = "HIGH";
        notes.push("PII stored in raw form - high breach impact");
      } else if (piiMode === "REDACTED") {
        severity = "MEDIUM";
        notes.push("PII redacted but still present - moderate risk");
      } else {
        severity = "LOW";
        notes.push("PII minimized - reduced breach impact");
      }
    }

    return { severity, notes };
  }, [
    mode,
    threat,
    defense,
    csp,
    tokenStorage,
    clickjackingDefense,
    deps,
    piiMode,
    config,
  ]);

  // Add event log entry
  const addEventLog = useCallback(
    (cause: string, decision: string, explanation: string) => {
      const newEntry: EventLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        cause,
        decision,
        explanation,
      };
      setEventLog((prev) => [...prev, newEntry]);
    },
    []
  );

  // Handle mode change
  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      addEventLog(
        `Mode: ${newMode}`,
        "Mode switched",
        `Switched to ${newMode.replace("_", " ")} mode`
      );
    },
    [addEventLog]
  );

  // Handle defense changes
  const handleDefenseChange = useCallback(
    (field: keyof DefenseState, value: boolean | SameSite) => {
      setDefense((prev) => ({ ...prev, [field]: value }));
      if (field === "inputEncoding" && value) {
        addEventLog(
          "inputEncoding: ON",
          "XSS defense enabled",
          "Input encoding prevents script injection"
        );
      } else if (field === "sanitizeHtml" && value) {
        addEventLog(
          "sanitizeHtml: ON",
          "XSS defense enabled",
          "HTML sanitization removes dangerous markup"
        );
      } else if (field === "sameSite" && value !== "NONE") {
        addEventLog(
          `sameSite: ${value}`,
          "CSRF defense enabled",
          `SameSite=${value} blocks cross-site requests`
        );
      } else if (field === "csrfToken" && value) {
        addEventLog(
          "csrfToken: ON",
          "CSRF defense enabled",
          "CSRF token validation blocks unauthorized requests"
        );
      }
    },
    [addEventLog]
  );

  // Handle CSP changes
  const handleCspChange = useCallback(
    (field: keyof CSPState, value: ScriptSrc | ConnectSrc | FrameAncestors) => {
      setCsp((prev) => ({ ...prev, [field]: value }));
      addEventLog(
        `CSP ${field}: ${value}`,
        "CSP updated",
        `Content Security Policy ${field} set to ${value}`
      );
    },
    [addEventLog]
  );

  // Handle token storage change
  const handleTokenStorageChange = useCallback(
    (value: TokenStorage) => {
      setTokenStorage(value);
      if (value === "HTTP_ONLY_COOKIE") {
        addEventLog(
          "tokenStorage: HttpOnly cookie",
          "Token storage updated",
          "HttpOnly cookie reduces XSS token theft risk but requires CSRF/SameSite considerations"
        );
      } else if (value === "LOCAL_STORAGE") {
        addEventLog(
          "tokenStorage: localStorage",
          "Token storage updated",
          "localStorage accessible to XSS - token theft risk"
        );
      } else {
        addEventLog(
          "tokenStorage: Memory",
          "Token storage updated",
          "Memory storage reduces persistence but requires refresh flow"
        );
      }
    },
    [addEventLog]
  );

  // Handle clickjacking defense change
  const handleClickjackingDefenseChange = useCallback(
    (value: ClickjackingDefense) => {
      setClickjackingDefense(value);
      if (value === "NONE") {
        addEventLog(
          "clickjackingDefense: NONE",
          "Defense disabled",
          "No clickjacking defense - page can be embedded"
        );
      } else if (value === "XFO_DENY") {
        addEventLog(
          "clickjackingDefense: XFO_DENY",
          "Defense enabled",
          "X-Frame-Options: DENY prevents embedding"
        );
      } else {
        addEventLog(
          "clickjackingDefense: CSP_FRAME_ANCESTORS",
          "Defense enabled",
          "CSP frame-ancestors prevents embedding"
        );
      }
    },
    [addEventLog]
  );

  // Handle PII mode change
  const handlePiiModeChange = useCallback(
    (value: PIIMode) => {
      setPiiMode(value);
      if (value === "RAW") {
        addEventLog(
          "piiMode: RAW",
          "PII handling updated",
          "PII stored in raw form - high breach impact"
        );
      } else if (value === "REDACTED") {
        addEventLog(
          "piiMode: REDACTED",
          "PII handling updated",
          "PII redacted but still present - moderate risk"
        );
      } else {
        addEventLog(
          "piiMode: MINIMIZED",
          "PII handling updated",
          "PII minimized - reduced breach impact and compliance risk"
        );
      }
    },
    [addEventLog]
  );

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p>Demo unavailable: Invalid configuration</p>
      </div>
    );
  }

  const controls = (
    <div className="space-y-4">
      {/* 2D/3D Toggle */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          View Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("2D")}
            className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
              viewMode === "2D"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            2D
          </button>
          <button
            onClick={() => setViewMode("3D")}
            className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
              viewMode === "3D"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            3D
          </button>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              "XSS_CSRF",
              "CSP",
              "TOKEN_STORAGE",
              "CLICKJACKING",
              "DEPENDENCIES",
              "PII",
            ] as Mode[]
          ).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-3 py-2 text-xs rounded border transition-colors ${
                mode === m
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {m.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Mode-specific controls */}
      {mode === "XSS_CSRF" && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Threat
            </label>
            <select
              value={threat}
              onChange={(e) => {
                setThreat(e.target.value as Threat);
                addEventLog(
                  `Threat: ${e.target.value}`,
                  "Threat selected",
                  `Switched to ${e.target.value} threat model`
                );
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="XSS">XSS (Cross-Site Scripting)</option>
              <option value="CSRF">CSRF (Cross-Site Request Forgery)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Defenses
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={defense.inputEncoding}
                  onChange={(e) =>
                    handleDefenseChange("inputEncoding", e.target.checked)
                  }
                  className="rounded"
                />
                <span className="text-sm">Input Encoding</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={defense.sanitizeHtml}
                  onChange={(e) =>
                    handleDefenseChange("sanitizeHtml", e.target.checked)
                  }
                  className="rounded"
                />
                <span className="text-sm">Sanitize HTML</span>
              </label>
              <div className="space-y-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">
                  SameSite
                </label>
                <select
                  value={defense.sameSite}
                  onChange={(e) =>
                    handleDefenseChange("sameSite", e.target.value as SameSite)
                  }
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-xs"
                >
                  <option value="NONE">None</option>
                  <option value="LAX">Lax</option>
                  <option value="STRICT">Strict</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={defense.csrfToken}
                  onChange={(e) =>
                    handleDefenseChange("csrfToken", e.target.checked)
                  }
                  className="rounded"
                />
                <span className="text-sm">CSRF Token</span>
              </label>
            </div>
          </div>
        </>
      )}

      {mode === "CSP" && (
        <div className="space-y-3">
          <button
            onClick={() => {
              setEvaluatePolicyTrigger((prev) => prev + 1);
              addEventLog(
                "Evaluate Policy",
                "Policy evaluation triggered",
                "Evaluating CSP policy against actions"
              );
            }}
            className="w-full px-3 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            Evaluate Policy
          </button>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              script-src
            </label>
            <select
              value={csp.scriptSrc}
              onChange={(e) =>
                handleCspChange("scriptSrc", e.target.value as ScriptSrc)
              }
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-xs"
            >
              <option value="NONE">&apos;none&apos;</option>
              <option value="SELF">&apos;self&apos;</option>
              <option value="SELF_CDN">&apos;self&apos; + CDN</option>
              <option value="UNSAFE_INLINE">
                &apos;unsafe-inline&apos; (dangerous)
              </option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              connect-src
            </label>
            <select
              value={csp.connectSrc}
              onChange={(e) =>
                handleCspChange("connectSrc", e.target.value as ConnectSrc)
              }
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-xs"
            >
              <option value="SELF">&apos;self&apos;</option>
              <option value="API_ONLY">&apos;self&apos; + API</option>
              <option value="ANY">* (any)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              frame-ancestors
            </label>
            <select
              value={csp.frameAncestors}
              onChange={(e) =>
                handleCspChange(
                  "frameAncestors",
                  e.target.value as FrameAncestors
                )
              }
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-xs"
            >
              <option value="NONE">&apos;none&apos;</option>
              <option value="SELF">&apos;self&apos;</option>
              <option value="TRUSTED">&apos;self&apos; + trusted</option>
            </select>
          </div>
        </div>
      )}

      {mode === "TOKEN_STORAGE" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Token Storage
            </label>
            <select
              value={tokenStorage}
              onChange={(e) =>
                handleTokenStorageChange(e.target.value as TokenStorage)
              }
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-xs"
            >
              <option value="HTTP_ONLY_COOKIE">HttpOnly Cookie</option>
              <option value="LOCAL_STORAGE">localStorage</option>
              <option value="MEMORY">Memory (in-memory)</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={refreshFlow}
              onChange={(e) => {
                setRefreshFlow(e.target.checked);
                addEventLog(
                  `refreshFlow: ${e.target.checked ? "ON" : "OFF"}`,
                  "Refresh flow toggled",
                  e.target.checked
                    ? "Refresh flow enabled for token renewal"
                    : "Refresh flow disabled"
                );
              }}
              className="rounded"
            />
            <span className="text-xs">Refresh Flow</span>
          </label>
        </div>
      )}

      {mode === "CLICKJACKING" && (
        <div className="space-y-2">
          <button
            onClick={() => {
              setTryEmbedTrigger((prev) => prev + 1);
              addEventLog(
                "Try Embed",
                "Embed attempt triggered",
                "Attempting to embed page in iframe"
              );
            }}
            className="w-full px-3 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
          >
            Try Embed
          </button>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Defense
            </label>
            <select
              value={clickjackingDefense}
              onChange={(e) =>
                handleClickjackingDefenseChange(
                  e.target.value as ClickjackingDefense
                )
              }
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-xs"
            >
              <option value="NONE">None</option>
              <option value="XFO_DENY">X-Frame-Options: DENY</option>
              <option value="CSP_FRAME_ANCESTORS">CSP frame-ancestors</option>
            </select>
          </div>
        </div>
      )}

      {mode === "DEPENDENCIES" && (
        <div className="space-y-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {deps.length === 0
              ? "No dependencies loaded"
              : `${deps.length} dependencies`}
          </div>
          {deps.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {deps.map((dep, idx) => (
                <div
                  key={idx}
                  className="text-xs p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                >
                  <div className="font-medium">{dep.name}</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {dep.version}
                  </div>
                  <div
                    className={`mt-1 ${
                      dep.risk === "HIGH"
                        ? "text-red-600 dark:text-red-400"
                        : dep.risk === "MEDIUM"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    Risk: {dep.risk}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "PII" && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            PII Mode
          </label>
          <select
            value={piiMode}
            onChange={(e) => handlePiiModeChange(e.target.value as PIIMode)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-xs"
          >
            <option value="RAW">Raw</option>
            <option value="REDACTED">Redacted</option>
            <option value="MINIMIZED">Minimized</option>
          </select>
        </div>
      )}
    </div>
  );

  // 2D Visualization
  const visualization2D = (
    <Spotlight targetId={focusTarget || null}>
      <div className="space-y-6">
        {/* XSS/CSRF Flow */}
        {mode === "XSS_CSRF" && (
          <SpotlightTarget id="flow" className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {threat === "XSS" ? "XSS Defense Flow" : "CSRF Defense Flow"}
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              {threat === "XSS" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm">Untrusted Input</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-700" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        defense.inputEncoding || defense.sanitizeHtml
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm">
                      {defense.inputEncoding || defense.sanitizeHtml
                        ? "Defense Applied"
                        : "No Defense"}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-700" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        defense.inputEncoding || defense.sanitizeHtml
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm">Rendered Output</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm">Cross-Site Request</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-700" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        defense.sameSite !== "NONE" || defense.csrfToken
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm">
                      {defense.sameSite !== "NONE" || defense.csrfToken
                        ? "Defense Check"
                        : "No Defense"}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-700" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        defense.sameSite !== "NONE" || defense.csrfToken
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm">Request Result</span>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {allowedOrBlocked.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={reduced ? false : { opacity: 0, x: -8 }}
                  animate={reduced ? {} : { opacity: 1, x: 0 }}
                  transition={
                    reduced ? {} : { duration: 0.3, delay: idx * 0.1 }
                  }
                  className={`p-3 rounded border ${
                    item.result === "ALLOW"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{item.action}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        item.result === "ALLOW"
                          ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
                          : "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                      }`}
                    >
                      {item.result}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {item.reason}
                  </p>
                </motion.div>
              ))}
            </div>
          </SpotlightTarget>
        )}

        {/* CSP Visualizer */}
        {mode === "CSP" && (
          <SpotlightTarget id="csp" className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              CSP Policy Effects
            </h4>
            <div className="space-y-2">
              {allowedOrBlocked.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={reduced ? false : { opacity: 0, y: -8 }}
                  animate={reduced ? {} : { opacity: 1, y: 0 }}
                  transition={
                    reduced ? {} : { duration: 0.3, delay: idx * 0.1 }
                  }
                  className={`p-3 rounded border ${
                    item.result === "ALLOW"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{item.action}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        item.result === "ALLOW"
                          ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                          : "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
                      }`}
                    >
                      {item.result}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {item.reason}
                  </p>
                </motion.div>
              ))}
            </div>
          </SpotlightTarget>
        )}

        {/* Token Storage Sim */}
        {mode === "TOKEN_STORAGE" && (
          <SpotlightTarget id="token.sim" className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Token Storage & Threat Surface
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage Location</span>
                <span className="text-sm font-medium">{tokenStorage}</span>
              </div>
              <div className="h-px bg-gray-300 dark:bg-gray-700" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    XSS Accessible
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      tokenStorage === "LOCAL_STORAGE"
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {tokenStorage === "LOCAL_STORAGE" ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    CSRF Risk
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      tokenStorage === "HTTP_ONLY_COOKIE"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {tokenStorage === "HTTP_ONLY_COOKIE"
                      ? "Requires SameSite"
                      : "Low"}
                  </span>
                </div>
                {refreshFlow && (
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    Refresh flow enabled: tokens renewed automatically
                  </div>
                )}
              </div>
            </div>
          </SpotlightTarget>
        )}

        {/* Clickjacking */}
        {mode === "CLICKJACKING" && (
          <SpotlightTarget id="frame" className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Clickjacking Defense
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Page Request</span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-px h-8 bg-gray-300 dark:bg-gray-700" />
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      clickjackingDefense !== "NONE"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm">
                    {clickjackingDefense !== "NONE"
                      ? "Defense Check"
                      : "No Defense"}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-px h-8 bg-gray-300 dark:bg-gray-700" />
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      clickjackingDefense !== "NONE"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm">
                    {clickjackingDefense !== "NONE"
                      ? "Embedding Blocked"
                      : "Embedding Allowed"}
                  </span>
                </div>
              </div>
            </div>
            {allowedOrBlocked.length > 0 && (
              <div className="mt-4">
                {allowedOrBlocked.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={reduced ? false : { opacity: 0, y: -8 }}
                    animate={reduced ? {} : { opacity: 1, y: 0 }}
                    transition={reduced ? {} : { duration: 0.3 }}
                    className={`p-3 rounded border ${
                      item.result === "ALLOW"
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{item.action}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          item.result === "ALLOW"
                            ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
                            : "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                        }`}
                      >
                        {item.result}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.reason}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </SpotlightTarget>
        )}

        {/* Dependencies */}
        {mode === "DEPENDENCIES" && (
          <SpotlightTarget id="deps" className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Dependency Risk Assessment
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm">Overall Risk</span>
                  <span
                    className={`text-sm font-bold ${
                      riskSummary.severity === "HIGH"
                        ? "text-red-600 dark:text-red-400"
                        : riskSummary.severity === "MEDIUM"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {riskSummary.severity}
                  </span>
                </div>
                {riskSummary.notes.map((note, idx) => (
                  <motion.div
                    key={idx}
                    initial={reduced ? false : { opacity: 0, x: -8 }}
                    animate={reduced ? {} : { opacity: 1, x: 0 }}
                    transition={
                      reduced ? {} : { duration: 0.3, delay: idx * 0.1 }
                    }
                    className="text-xs text-gray-700 dark:text-gray-300 p-2 bg-white dark:bg-gray-800 rounded"
                  >
                    {note}
                  </motion.div>
                ))}
              </div>
            </div>
          </SpotlightTarget>
        )}

        {/* PII */}
        {mode === "PII" && (
          <SpotlightTarget id="pii" className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              PII Handling
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <div className="text-xs font-medium mb-2">Event Payload:</div>
              {piiMode === "RAW" && (
                <div className="text-xs font-mono bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                  {`{
  "userId": "12345",
  "email": "user@example.com",
  "phone": "+1234567890",
  "action": "checkout"
}`}
                </div>
              )}
              {piiMode === "REDACTED" && (
                <motion.div
                  initial={reduced ? false : { opacity: 0 }}
                  animate={reduced ? {} : { opacity: 1 }}
                  transition={reduced ? {} : { duration: 0.3 }}
                  className="text-xs font-mono bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700"
                >
                  {`{
  "userId": "12345",
  "email": "u***@e***.com",
  "phone": "+1***7890",
  "action": "checkout"
}`}
                </motion.div>
              )}
              {piiMode === "MINIMIZED" && (
                <motion.div
                  initial={reduced ? false : { opacity: 0 }}
                  animate={reduced ? {} : { opacity: 1 }}
                  transition={reduced ? {} : { duration: 0.3 }}
                  className="text-xs font-mono bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700"
                >
                  {`{
  "userId": "12345",
  "action": "checkout"
}`}
                </motion.div>
              )}
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                {riskSummary.notes[0] || "PII handling configured"}
              </div>
            </div>
          </SpotlightTarget>
        )}

        {/* Risk Summary */}
        <SpotlightTarget id="risk" className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Risk Summary
          </h4>
          <div
            className={`p-3 rounded border ${
              riskSummary.severity === "HIGH"
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : riskSummary.severity === "MEDIUM"
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                  : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Severity:</span>
              <span
                className={`text-sm font-bold ${
                  riskSummary.severity === "HIGH"
                    ? "text-red-600 dark:text-red-400"
                    : riskSummary.severity === "MEDIUM"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-green-600 dark:text-green-400"
                }`}
              >
                {riskSummary.severity}
              </span>
            </div>
            <ul className="space-y-1">
              {riskSummary.notes.map((note, idx) => (
                <li
                  key={idx}
                  className="text-xs text-gray-700 dark:text-gray-300"
                >
                  • {note}
                </li>
              ))}
            </ul>
          </div>
        </SpotlightTarget>
      </div>
    </Spotlight>
  );

  // 3D Visualization
  const visualization3D = (
    <ThreeCanvasShell
      className="w-full h-[600px] bg-gray-900 rounded-lg"
      fallback={
        <Fallback2D message="3D unavailable, showing 2D view">
          {visualization2D}
        </Fallback2D>
      }
    >
      <SecuritySandboxScene
        mode={mode}
        threat={threat}
        defense={defense}
        csp={csp}
        tokenStorage={tokenStorage}
        clickjackingDefense={clickjackingDefense}
        deps={deps}
        piiMode={piiMode}
        allowedOrBlocked={allowedOrBlocked}
        riskSummary={riskSummary}
        evaluatePolicyTrigger={evaluatePolicyTrigger}
        tryEmbedTrigger={tryEmbedTrigger}
        focusTarget={focusTarget}
        cameraPreset={cameraPreset}
        onCameraPresetChange={setCameraPreset}
      />
    </ThreeCanvasShell>
  );

  return (
    <DemoShell
      controls={controls}
      visualization={viewMode === "3D" ? visualization3D : visualization2D}
      eventLog={<EventLog entries={eventLog} />}
    />
  );
}
