"use client";

import { useEffect } from "react";

export function SWRegister() {
  useEffect(() => {
    // Only register service worker in browsers that support it
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV !== "test"
    ) {
      // Register the service worker
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            "/service-worker.js",
            {
              scope: "/",
            }
          );

          console.log(
            "[SW] Service Worker registered with scope:",
            registration.scope
          );

          // Check for updates on page load
          registration.update();

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available
                  console.log("[SW] New service worker available");

                  // Optionally notify user about update
                  // For now, just log it. You could show a toast here.
                  if (
                    window.confirm("New version available! Click OK to update.")
                  ) {
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Handle controller change (new SW activated)
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            console.log("[SW] Controller changed, reloading page");
            window.location.reload();
          });
        } catch (error) {
          console.error("[SW] Service Worker registration failed:", error);
        }
      };

      // Register on load
      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
      }
    }
  }, []);

  return null;
}
