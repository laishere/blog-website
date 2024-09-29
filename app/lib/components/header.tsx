import { Link, useLocation, useMatches, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import config from "~/config";
import { clientSetCookie, getCookie } from "../cookies";
import { getCurrentLang, useTranslation } from "../i18n";
import {
  IconEn,
  IconGithub,
  IconHome,
  IconMoon,
  IconSun,
  IconSystem,
  IconZh,
} from "../icons";
import { getHomeUrl, replacePathWithLang } from "../urls";
import { PopupMenu } from "./popup-menu";

const colorSchemes = [
  {
    icon: IconSun,
    label: "Light",
    value: "light",
  },
  {
    icon: IconMoon,
    label: "Dark",
    value: "dark",
  },
  {
    icon: IconSystem,
    label: "System",
    value: "system",
  },
];

const langs = [
  {
    icon: IconEn,
    label: "English",
    value: "en",
  },
  {
    icon: IconZh,
    label: "简体中文",
    value: "zh",
  },
];

const COLOR_SCHEME_KEY = "color-scheme";

function saveColorScheme(scheme: string) {
  localStorage.setItem(COLOR_SCHEME_KEY, scheme);
}

function loadColorScheme() {
  return localStorage.getItem(COLOR_SCHEME_KEY);
}

function toggleColorScheme(scheme: string) {
  document.documentElement.classList.toggle("dark", scheme === "dark");
  clientSetCookie("colorScheme", scheme);
}

const isBrowser = typeof window !== "undefined";

function getInitColorScheme() {
  if (isBrowser) {
    const scheme = loadColorScheme();
    if (scheme) {
      return scheme;
    }
  }
  const isSystem = getCookie("colorScheme.auto") === "1";
  if (isSystem) {
    return "system";
  }
  return getCookie("colorScheme") || "system";
}

function computeDisplayScheme(scheme: string) {
  if (scheme !== "system") {
    return scheme;
  }
  if (isBrowser) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return getCookie("colorScheme") || "light";
}

export function Header() {
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const isHome = lastMatch.handle === "home";
  const [schemePopupVisible, setSchemePopupVisible] = useState(false);
  const [colorScheme, setColorScheme] = useState<string>(getInitColorScheme());
  const [langPopupVisible, setLangPopupVisible] = useState(false);
  const [lang, setLang] = useState(getCurrentLang());
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const scheme = loadColorScheme();
    setColorScheme(scheme || "system");
  }, []);
  useEffect(() => {
    if (colorScheme === "system") {
      const listener = (e: MediaQueryListEvent | MediaQueryList) => {
        toggleColorScheme(e.matches ? "dark" : "light");
      };
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", listener);
      listener(mediaQuery);
      return () => {
        mediaQuery.removeEventListener("change", listener);
      };
    } else if (colorScheme) {
      toggleColorScheme(colorScheme);
    }
  }, [colorScheme]);
  const updateColorScheme = (scheme: string) => {
    if (colorScheme == scheme) {
      return;
    }
    setColorScheme(scheme);
    saveColorScheme(scheme);
    clientSetCookie("colorScheme.auto", scheme == "system" ? "1" : "0");
    setSchemePopupVisible(false);
  };
  const updateLang = (newLang: string) => {
    if (lang == newLang) {
      return;
    }
    const path = replacePathWithLang(location.pathname, newLang);
    setLang(newLang);
    setLangPopupVisible(false);
    clientSetCookie("lang", newLang);
    navigate(path);
  };
  const ActiveSchemeIcon =
    computeDisplayScheme(colorScheme) == "light" ? IconSun : IconMoon;
  const ActiveLangIcon = lang == "en" ? IconEn : IconZh;
  const { t } = useTranslation();
  return (
    <div className="relative z-10 flex justify-end items-center py-8 max-w-6xl px-6 sm:px-8 mx-auto space-x-6">
      {!isHome && (
        <>
          <Link to={getHomeUrl()} title={t("Home")}>
            <IconHome className="text-2xl" />
          </Link>
          <div className="flex-1 sm:hidden"></div>
        </>
      )}
      <PopupMenu
        visible={schemePopupVisible}
        align="center"
        bgClassName="bg-white dark:bg-slate-800"
        onVisibleChange={setSchemePopupVisible}
        menu={
          <div className="min-w-32 px-2 py-2 flex flex-col gap-1">
            {colorSchemes.map((item, index) => (
              <button
                key={index}
                className={
                  "flex items-center h-8 hover:text-white hover:bg-blue-700 px-2 rounded" +
                  (colorScheme === item.value ? " bg-blue-700 text-white" : "")
                }
                onClick={() => updateColorScheme(item.value)}
              >
                <div className="w-8">{<item.icon className="text-xl" />}</div>{" "}
                {t(item.label)}
              </button>
            ))}
          </div>
        }
      >
        <ActiveSchemeIcon
          className="text-2xl"
          title={t("Change color scheme")}
        />
      </PopupMenu>

      <PopupMenu
        visible={langPopupVisible}
        align="center"
        bgClassName="bg-white dark:bg-slate-800"
        onVisibleChange={setLangPopupVisible}
        menu={
          <div className="min-w-32 px-2 py-2 flex flex-col gap-1">
            {langs.map((item, index) => (
              <button
                key={index}
                className={
                  "flex items-center h-8 hover:text-white hover:bg-blue-700 px-2 rounded" +
                  (lang === item.value ? " bg-blue-700 text-white" : "")
                }
                onClick={() => updateLang(item.value)}
              >
                <div className="w-6">{<item.icon className="text-xl" />}</div>{" "}
                {item.label}
              </button>
            ))}
          </div>
        }
      >
        <ActiveLangIcon className="text-2xl" title={t("Change language")} />
      </PopupMenu>

      <a href={config.githubUrl}>
        <IconGithub className="text-2xl" />
      </a>
    </div>
  );
}
