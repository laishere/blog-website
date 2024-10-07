import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { useLocation } from "@remix-run/react";
import { useEffect } from "react";

const USE_FIREBASE =
  !import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE === "true";

let app: ReturnType<typeof initializeApp> | null = null;

async function requireFirebase() {
  if (app) {
    return app;
  }
  const { firebaseConfig } = await import("~/secrets/firebase");
  app = initializeApp(firebaseConfig);
  return app;
}

async function logPageView(path: string) {
  const firebase = await requireFirebase();
  const analytics = getAnalytics(firebase);
  logEvent(analytics, "page_view", { page_path: path });
}

export function usePVAnalytics() {
  const path = useLocation().pathname;
  useEffect(() => {
    USE_FIREBASE && logPageView(path);
  }, [path]);
}
