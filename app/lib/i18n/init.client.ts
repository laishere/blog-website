import { init, use } from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultInitOptions } from ".";
import BackendHttp from "i18next-http-backend";

export async function clientInitI18n() {
  use(BackendHttp);
  use(initReactI18next);
  return init({
    ...defaultInitOptions,
    backend: {
      loadPath: "/locales/{{lng}}.json",
    },
  });
}
