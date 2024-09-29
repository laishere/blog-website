import { ErrorResponse, Link } from "@remix-run/react";
import oops from "~/assets/oops.png?url";
import { useTranslation } from "../i18n";
import { getHomeUrl } from "../urls";

export default function ErrorView({ error }: { error: unknown }) {
  const { t } = useTranslation();
  let errorMessage = t("Oops, something went wrong");
  const err = error as Partial<ErrorResponse>;
  if (err.status === 404) {
    errorMessage = t("Page not found");
  } else {
    console.error(error);
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <img
        className="object-contain dark:invert dark:opacity-90 sm:h-[50vh]"
        src={oops}
        alt="Oops..."
      />
      <div className="flex flex-col items-center sm:mr-16">
        <div className="text-2xl pt-4">{errorMessage}</div>
        <Link
          className="mt-8 px-4 py-2 border-2 rounded-md"
          to={getHomeUrl()}
          replace
        >
          {t("Go Home")}
        </Link>
      </div>
    </div>
  );
}
