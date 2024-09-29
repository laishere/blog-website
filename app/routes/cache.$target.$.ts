import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/server-runtime";
import serverConfig from "~/config.server";
import {
  FileNotFoundError,
  getPostMeta,
  loadPostsMeta,
  readPost,
  RenderPost,
} from "~/lib/content";
import { loadPostsMetaCache, purgePostsMetaCache } from "~/lib/content/cache";
import { markdownToHtml } from "~/lib/md.server";
import { setRequestContext } from "~/lib/request";

export async function loader({ params, request }: LoaderFunctionArgs) {
  setRequestContext(request);
  const { target } = params;
  try {
    if (target === "meta") {
      const ret = await loadPostsMeta();
      return new Response(JSON.stringify(ret), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "public, max-age=60, s-maxage=60, stale-while-revalidate=60",
        },
      });
    } else if (target === "post") {
      const parts = params["*"]!.split("/");
      if (parts.length !== 3) {
        throw new Response("Bad Request", { status: 400 });
      }
      const [lang, slug, version] = parts;
      const ret = await loadRenderPost(lang, slug, version);
      return new Response(JSON.stringify(ret), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    }
  } catch (error) {
    if (error === FileNotFoundError) {
      throw new Response("Not Found", { status: 404 });
    }
    throw error;
  }
  throw new Response("Bad Request", { status: 400 });
}

export async function action({ params }: ActionFunctionArgs) {
  if (params.target === "purge") {
    const secret = params["*"];
    if (!secret || secret !== serverConfig.cachePurgeSecret) {
      throw new Response("Forbidden", { status: 403 });
    }
    purgePostsMetaCache();
    return new Response("OK", { status: 200 });
  }
  throw new Response("Bad Request", { status: 400 });
}

async function loadRenderPost(
  lang: string,
  slug: string,
  version: string
): Promise<RenderPost> {
  const posts = await loadPostsMetaCache();
  const meta = getPostMeta(posts, lang, slug);
  if (meta.md5 !== version) {
    console.warn("Version does not match with " + meta.md5);
  }
  const post = await readPost(meta);
  const ret = await markdownToHtml(post.content);
  return {
    renderTime: Date.now(),
    meta: post.meta,
    ...ret,
  };
}
