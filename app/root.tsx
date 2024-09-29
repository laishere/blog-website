import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  json,
  Links,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigation,
  useRouteError,
  useRouteLoaderData,
} from "@remix-run/react";

import { SpeedInsights } from "@vercel/speed-insights/remix";
import i18next from "i18next";
import nprogress from "nprogress";
import { useEffect } from "react";
import { getCookie, getCookies, setCookies } from "./lib/cookies";
import i18n, {
  defaultLang,
  SupportedLocalesMap,
  useI18nLang,
} from "./lib/i18n";
import {
  configBaseUrl,
  parseUrlPathLang,
  replacePathWithLang,
} from "./lib/urls";

import "nprogress/nprogress.css";
import { ContentLayout } from "./lib/components";
import { serverInitI18n } from "./lib/i18n/init.server";
import "./nprogress.css";
import "./tailwind.css";

import { isbot } from "isbot";
import ErrorView from "~/lib/components/error";
import { setRequestContext } from "./lib/request";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

let isI18nInitialized = false;

function extractLang(header: string) {
  const lang = getCookie("lang");
  if (lang && lang in SupportedLocalesMap) {
    return lang;
  }
  const options = header.split(";");
  for (const option of options) {
    const items = option.split(",");
    for (const item of items) {
      if (item.startsWith("q=")) {
        continue;
      }
      const lang = item.split("-")[0];
      if (lang in SupportedLocalesMap) {
        return lang;
      }
    }
  }
  return defaultLang;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const { lang, path } = parseUrlPathLang(url.pathname);
  if (lang == defaultLang && url.pathname !== path) {
    // Omit default lang in URL
    return redirect(path);
  }
  setRequestContext(request);
  const cookies = getCookies();
  const desiredLang = extractLang(request.headers.get("Accept-Language") || "");
  const bot = isbot(request.headers.get("user-agent") || "");
  if (lang !== desiredLang && !bot) {
    return redirect(replacePathWithLang(url.pathname, desiredLang), {
      headers: { "Set-Cookie": `lang=${desiredLang}; Path=/` },
    });
  }
  const shouldSetLangCookie = !bot && !getCookie("lang");
  if (!isI18nInitialized) {
    await serverInitI18n(lang); // Don't do this in entry.server.ts, which is fired after this loader
    isI18nInitialized = true;
  } else {
    await i18n.changeLanguage(lang);
  }
  return json(
    {
      // Shouldn't rely on loader to set lang. When url is changed (in SPA),
      // root loader won't be called, lang is not updated.
      colorScheme: cookies.colorScheme,
      cookies,
      i18nStore: i18next.store.data,
    },
    {
      headers: shouldSetLangCookie
        ? { "Set-Cookie": `lang=${desiredLang}; Path=/` }
        : undefined,
    }
  );
}

let isAnchorScrollInit = false;

export function Layout({ children }: { children: React.ReactNode }) {
  const { colorScheme, cookies, i18nStore } =
    useRouteLoaderData<typeof loader>("root") || {};
  if (typeof window !== "undefined") {
    configBaseUrl(window.location.href);
  }
  const location = useLocation();
  const { lang } = parseUrlPathLang(location.pathname);
  // Using i18n resource from loader to save network request
  useI18nLang(lang, i18nStore || {});
  setCookies(cookies || {}); // Must call here not in loader
  const navigation = useNavigation();
  useEffect(() => {
    navigation.state == "loading" ? nprogress.start() : nprogress.done();
  }, [navigation.state]);
  useEffect(() => {
    if (location.hash && !isAnchorScrollInit) {
      isAnchorScrollInit = true;
      setTimeout(() => {
        try {
          const el = document.querySelector(location.hash);
          if (el) {
            el.scrollIntoView();
          }
        } catch {
          // Ignore
        }
      }, 100);
    }
  }, [location.hash]);
  return (
    <html
      lang={lang}
      className={colorScheme == "dark" ? "dark" : undefined}
      dir={i18n.dir()}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return <ErrorView error={error} />;
}

export default function App() {
  return (
    <ContentLayout>
      <SpeedInsights />
      <Outlet />
    </ContentLayout>
  );
}
