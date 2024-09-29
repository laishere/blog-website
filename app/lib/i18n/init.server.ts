import { init, InitOptions, use } from "i18next";
import { ReadCallback, Services } from "node_modules/i18next";
import { initReactI18next } from "react-i18next";
import { defaultInitOptions } from ".";

async function loadLangResource(lang: string) {
  const ret = await import(`../../../public/locales/${lang}.json`);
  return ret.default;
}

class Backend {
  static type = "backend";

  init(
    _services: Services,
    _backendOptions: object,
    _i18nextOptions: InitOptions
  ): void {}

  read(language: string, _namespace: string, callback: ReadCallback): void {
    loadLangResource(language).then((resource) => {
      callback(null, resource);
    });
  }
}

export async function serverInitI18n(lang: string) {
  use(Backend as never);
  use(initReactI18next);
  return init({
    ...defaultInitOptions,
    lng: lang,
  });
}
