"use client";

import { useEffect } from "react";

/**
 * Catches unhandled errors and promise rejections that might not reach React's error boundary.
 * Logs to console so they're visible when removeConsole excludes "error".
 */
export function ClientErrorHandler() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      console.error("[ClientErrorHandler] Unhandled error:", e.message, e.filename, e.lineno, e.error);
    };
    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      console.error("[ClientErrorHandler] Unhandled promise rejection:", e.reason);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);
  return null;
}
