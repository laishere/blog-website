import { useLocation } from "@remix-run/react";
import { getAnalytics, logEvent } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { useEffect } from "react";
import { firebaseConfig } from "~/secrets/firebase";

const USE_FIREBASE = !import.meta.env.DEV;

let app: ReturnType<typeof initializeApp> | null = null;

async function requireFirebase() {
  if (app) {
    return app;
  }
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
