import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
  Link,
  useLoaderData,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import config from "~/config";
import { FileNotFoundError } from "~/lib/content";
import { loadRenderPostCache } from "~/lib/content/cache";
import {
  defaultLang,
  formatDate,
  formatDateTime,
  SupportedLocalesMap,
  useTranslation,
} from "~/lib/i18n";
import { setRequestContext } from "~/lib/request";
import { postFullUrl } from "~/lib/urls";
import "./styles.scss";
import { useEffect, useRef, useState } from "react";

export const meta: MetaFunction<typeof loader> = (args) => {
  const { post } = args.data!;
  const { description, image } = post.meta;
  const results: ReturnType<typeof meta> = [];
  const add = (name: string, content?: string) => {
    if (content) {
      results.push({ name, content });
    }
  };
  const title = `${post.meta.title} | ${config.owner}`;
  results.push({ title });
  add("description", description);
  // og
  add("og:title", title);
  add("og:description", description);
  add("og:image", image);
  // twitter
  add("twitter:title", title);
  add("twitter:description", description);
  add("twitter:image", image);
  results.push({
    name: "twitter:card",
    content: image ? "summary_large_image" : "summary",
  });
  const { langs: langs } = post.meta;
  for (const lang of langs) {
    if (lang == post.meta.lang) {
      continue;
    }
    const url = postFullUrl(lang, post.meta.slug);
    results.push({
      tagName: "link",
      rel: "alternate",
      hrefLang: lang,
      href: url,
    });
  }
  results.push({ name: "robots", content: "index, follow" });
  return results;
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  setRequestContext(request);
  const { slug } = params;
  const lang = params.lang || defaultLang;
  if (!slug || !(lang in SupportedLocalesMap)) {
    throw new Response("Not Found", { status: 404 });
  }
  try {
    const post = await loadRenderPostCache(lang, slug);
    return {
      slug,
      post,
    };
  } catch (e) {
    if (e == FileNotFoundError) {
      throw new Response("Not Found", { status: 404 });
    }
    console.error(e);
    throw new Response("Internal server error", { status: 500 });
  }
}

function parseHeading(html: string) {
  const matches = html.match(
    /<span data-id="(.+?)" data-level="(.+?)">(.+?)<\/span>/
  );
  if (!matches) {
    return { id: "", level: 0 };
  }
  const [, id, level] = matches;
  return { id, level: parseInt(level) };
}

export default function Index() {
  const { post } = useLoaderData<typeof loader>();
  const { html, renderTime, navList } = post;
  const [renderTimeText, setRenderTimeText] = useState(
    new Date(renderTime).toUTCString()
  );
  const { t } = useTranslation();
  useEffect(() => {
    // Avoid hydration issue cause by server/client time zone difference
    setRenderTimeText(formatDateTime(new Date(renderTime)));
  }, [renderTime]);
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!contentRef.current) {
      return;
    }
    const clickListener = (e: MouseEvent) => {
      const el = e.currentTarget as HTMLAnchorElement;
      const url = new URL(el.href);
      if (url.hash) {
        e.preventDefault();
        navigate(url.hash, { preventScrollReset: true });
      }
    };
    const list = contentRef.current.querySelectorAll<HTMLAnchorElement>(
      "a:has(span.icon-link)"
    );
    list.forEach((el) => el.addEventListener("click", clickListener));
    return () => {
      list.forEach((el) => el.removeEventListener("click", clickListener));
    };
  }, [navigate, location.pathname]);
  useEffect(() => {
    if (!contentRef.current) {
      return;
    }
    const clickListener = (e: MouseEvent) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const code = btn.parentElement!.querySelector("code")!;
      navigator.clipboard.writeText(code.textContent!);
      btn.classList.add("checked");
      setTimeout(() => {
        btn.classList.remove("checked");
      }, 1500);
    };
    const list =
      contentRef.current.querySelectorAll<HTMLButtonElement>("button.copy-btn");
    list.forEach((e) => e.addEventListener("click", clickListener));
    return () => {
      list.forEach((e) => e.removeEventListener("click", clickListener));
    };
  }, [location.pathname]);
  const scrollToTop = () => {
    window.scrollTo({ top: 0 });
  };
  return (
    <div className="px-4">
      <div className="max-w-full md:max-w-3xl mx-auto relative xl:-left-32">
        <div className="rounded-lg overflow-hidden mb-6 relative">
          <img
            src={post.meta.image}
            alt="Cover"
            className="w-full aspect-video object-cover"
          />
          <div className="absolute bottom-0 flex flex-col justify-end w-full h-2/3 px-4 pb-2 md:pb-4 bg-gradient-to-b from-transparent to-[#00000080]">
            <p className="text-white md:text-lg">
              {formatDate(new Date(post.meta.publishDate))}
            </p>
            <h1 className="text-white text-2xl md:text-4xl md:leading-relaxed font-extrabold">
              {post.meta.title}
            </h1>
          </div>
        </div>
        <div
          ref={contentRef}
          className="md-content"
          dangerouslySetInnerHTML={{ __html: html }}
        ></div>
        <div className="hidden xl:block w-64 absolute top-0 bottom-0 left-full">
          <nav className="toc sticky top-4 ml-8 break-words overflow-hidden">
            <button onClick={scrollToTop}>
              <p className="text-lg font-semibold text-gray-600 dark:text-gray-100">
                {t("On this page")}
              </p>
            </button>
            <ul className="grid gap-2 text-sm text-gray-600 dark:text-gray-300 mt-2">
              {navList.map((item, index) => {
                const { id, level } = parseHeading(item);
                return (
                  <li className={level > 2 ? "ml-4" : undefined} key={index}>
                    <Link
                      to={"#" + id}
                      className="hover:underline underline-offset-4"
                      preventScrollReset
                      dangerouslySetInnerHTML={{ __html: item }}
                    ></Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
      <div className="text-sm text-center text-gray-400">
        {t("Render time")}: {renderTimeText}
      </div>
    </div>
  );
}
