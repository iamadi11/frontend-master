"use client";

import { useMotionPrefs } from "../motion/MotionPrefsProvider";
import { motion, AnimatePresence } from "framer-motion";

interface MFE {
  name: string;
  routes: string[];
  ownedComponents: string[];
  apiContracts: string[];
}

interface MFBoundaryMapProps {
  mfes: MFE[];
  selectedRoute?: string;
  selectedComponent?: string;
  integrationType: "ROUTE_BASED" | "COMPONENT_BASED";
  onRouteClick?: (route: string) => void;
  onComponentClick?: (component: string) => void;
}

export function MFBoundaryMap({
  mfes,
  selectedRoute,
  selectedComponent,
  integrationType,
  onRouteClick,
  onComponentClick,
}: MFBoundaryMapProps) {
  const { reduced } = useMotionPrefs();

  const getOwner = (routeOrComponent: string): MFE | null => {
    for (const mfe of mfes) {
      if (
        mfe.routes.includes(routeOrComponent) ||
        mfe.ownedComponents.includes(routeOrComponent)
      ) {
        return mfe;
      }
    }
    return null;
  };

  const selectedOwner = selectedRoute
    ? getOwner(selectedRoute)
    : selectedComponent
      ? getOwner(selectedComponent)
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Micro-frontend Boundaries
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Integration:{" "}
          {integrationType === "ROUTE_BASED"
            ? "Route-based"
            : "Component-based"}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mfes.map((mfe, index) => {
          const isSelected = selectedOwner?.name === mfe.name;
          return (
            <motion.div
              key={mfe.name}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={reduced ? {} : { opacity: 1, y: 0 }}
              transition={reduced ? {} : { duration: 0.3, delay: index * 0.1 }}
              className={`p-4 rounded-lg border-2 ${
                isSelected
                  ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}
            >
              <h5 className="font-semibold text-sm mb-3 text-gray-800 dark:text-gray-200">
                {mfe.name}
              </h5>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Routes
                  </div>
                  <div className="space-y-1">
                    {mfe.routes.map((route) => {
                      const isSelectedRoute = route === selectedRoute;
                      return (
                        <motion.div
                          key={route}
                          whileHover={reduced ? {} : { scale: 1.02 }}
                          onClick={() => onRouteClick?.(route)}
                          className={`text-xs px-2 py-1 rounded cursor-pointer ${
                            isSelectedRoute
                              ? "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {route}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Components
                  </div>
                  <div className="space-y-1">
                    {mfe.ownedComponents.map((component) => {
                      const isSelectedComp = component === selectedComponent;
                      return (
                        <motion.div
                          key={component}
                          whileHover={reduced ? {} : { scale: 1.02 }}
                          onClick={() => onComponentClick?.(component)}
                          className={`text-xs px-2 py-1 rounded cursor-pointer ${
                            isSelectedComp
                              ? "bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {component}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {mfe.apiContracts.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      API Contracts
                    </div>
                    <div className="space-y-1">
                      {mfe.apiContracts.map((contract) => (
                        <div
                          key={contract}
                          className="text-xs px-2 py-1 rounded bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-mono"
                        >
                          {contract}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedOwner && (selectedRoute || selectedComponent) && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={reduced ? {} : { opacity: 1, y: 0 }}
          transition={reduced ? {} : { duration: 0.3 }}
          className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
        >
          <div className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
            Ownership:{" "}
            <span className="font-semibold">{selectedOwner.name}</span> owns{" "}
            {selectedRoute
              ? `route "${selectedRoute}"`
              : `component "${selectedComponent}"`}
          </div>
        </motion.div>
      )}
    </div>
  );
}
