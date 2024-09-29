import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, redirect, useLoaderData } from "@remix-run/react";
import config from "~/config";
import { getHomePosts } from "~/lib/content";
import { loadPostsMetaCache } from "~/lib/content/cache";
import {
  defaultLang,
  formatDate,
  getCurrentLang,
  SupportedLocalesMap,
  translate,
} from "~/lib/i18n";
import { setRequestContext } from "~/lib/request";
import { getHomeFullUrl, postUrl } from "~/lib/urls";

export const meta: MetaFunction = () => {
  const title = translate("home.title");
  const description = translate("home.description");
  const image = config.homeImage;
  const results: ReturnType<MetaFunction> = [{ title }];
  const add = (name: string, content: string) =>
    results.push({ name, content });
  add("description", description);
  add("og:title", title);
  add("og:description", description);
  add("og:image", image);
  add("twitter:title", title);
  add("twitter:description", description);
  add("twitter:image", image);
  add("twitter:card", "summary_large_image");
  add("robots", "index, follow");
  const langs = Object.keys(SupportedLocalesMap);
  for (const lang of langs) {
    if (lang == getCurrentLang()) {
      continue;
    }
    const url = getHomeFullUrl(lang);
    results.push({
      tagName: "link",
      rel: "alternate",
      hrefLang: lang,
      href: url,
    });
  }
  return results;
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  setRequestContext(request);
  const lang = params.lang || defaultLang;
  if (!(lang in SupportedLocalesMap)) {
    throw new Response("Not Found", { status: 404 });
  }
  if (!request.url.endsWith("/")) {
    return redirect(`/${lang}/`);
  }
  const posts = await loadPostsMetaCache();
  return getHomePosts(posts, lang);
}

export const handle = "home";

export default function Home() {
  const posts = useLoaderData<typeof loader>();
  return (
    <>
      <div className="dark:hidden fixed inset-0 bg-[url(noisy-texture.png)]"></div>
      <div className="relative grid gap-8 px-4 max-w-lg mx-auto">
        {posts.map((post, index) => (
          <Link to={postUrl(post.lang, post.slug)} key={index}>
            <div
              className="group cursor-pointer rounded-md bg-white shadow-lg sm:hover:shadow-2xl transition-all duration-500 overflow-hidden 
          bg-gradient-to-r from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-600"
            >
              <div className="overflow-hidden">
                <img
                  className="w-full aspect-video object-cover sm:group-hover:scale-105 transition-all duration-500"
                  src={post.image}
                  alt="Cover"
                />
              </div>
              <div className="p-4 bg-[url(noisy-texture.png)]">
                <p className="text-gray-800 dark:text-gray-200">
                  {formatDate(new Date(post.publishDate))}
                </p>
                <h2 className="text-2xl font-bold leading-relaxed text-gray-900 dark:text-gray-100">
                  {post.title}
                </h2>
                <p className="text-gray-800 dark:text-gray-200">
                  {post.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
