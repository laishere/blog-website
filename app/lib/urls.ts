import {
  defaultLang,
  getCurrentLang,
  SupportedLang,
  SupportedLocalesMap,
} from "./i18n";

let baseUrl = "";

export function configBaseUrl(url: string) {
  if (!url.startsWith("http")) {
    return;
  }
  return (baseUrl = new URL(url).origin);
}

export function getBaseUrl() {
  return baseUrl;
}

export function postFullUrl(lang: string, slug: string) {
  return baseUrl + postUrl(lang, slug);
}

export function postUrl(lang: string, slug: string) {
  if (lang === defaultLang) {
    return `/posts/${slug}`;
  }
  return `/${lang}/posts/${slug}`;
}

export function parseUrlPathLang(path: string): {
  lang: SupportedLang;
  path: string;
} {
  const matches = path.match(/^\/([^/]*)/);
  if (!matches) {
    return { lang: defaultLang, path };
  }
  const maybeLang = matches[1];
  if (!(maybeLang in SupportedLocalesMap)) {
    return { lang: defaultLang, path };
  }
  return {
    lang: maybeLang as SupportedLang,
    path: path.slice(maybeLang.length + 1),
  };
}

export function replacePathWithLang(path: string, lang: string) {
  let { path: restPath } = parseUrlPathLang(path);
  if (restPath && !restPath.startsWith("/")) {
    console.log(restPath);
    restPath = `/${restPath}`;
  }
  return lang === defaultLang ? restPath : `/${lang}${restPath}`;
}

export function getHomeUrl(lang: string = getCurrentLang()) {
  return lang === defaultLang ? "/" : `/${lang}/`;
}

export function getHomeFullUrl(lang: string = getCurrentLang()) {
  return baseUrl + getHomeUrl(lang);
}
