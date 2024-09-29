import i18next, { InitOptions, Resource, t } from "i18next";
import { useTranslation as _useTranslation, useSSR } from "react-i18next";

export const SupportedLocalesMap = {
  en: "en-US",
  zh: "zh-CN",
};

export type SupportedLang = keyof typeof SupportedLocalesMap;

export const defaultLang = "en";

let currentLocale = SupportedLocalesMap[defaultLang];
let currentLang = defaultLang;

export function useI18nLang(lang: SupportedLang, store: Resource) {
  currentLang = lang;
  currentLocale = SupportedLocalesMap[lang];
  useSSR(store, lang);
}

export const getCurrentLang = () => currentLang;

export function formatDate(date: Date) {
  return date.toLocaleDateString(currentLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: Date) {
  return date.toLocaleString(currentLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
}

export function useTranslation() {
  // Specify lng to avoid conflicts when loading other languages,
  // which will change i18n.language and cause hydration mismatch
  return _useTranslation(undefined, { lng: currentLang });
}

export function translate(key: string) {
  return t(key, { lng: currentLang });
}

export const defaultInitOptions: InitOptions = {
  supportedLngs: Object.keys(SupportedLocalesMap),
  interpolation: {
    escapeValue: false,
  },
};

const i18n = i18next;

export default i18n;
