import { getPostMeta, RenderPost } from ".";
import { purgeMemCache, withMemCache } from "../cache.server";
import { getRequestContext } from "../request";
import { getBaseUrl } from "../urls";
import { PostsMetaJsonScheme } from "./base";

function buildHeaders(): Record<string, string> {
  const req = getRequestContext();
  if (!req) {
    return {};
  }
  return {
    cookie: req.headers.get("cookie") || "",
  };
}

export async function loadPostsMetaCache(): Promise<PostsMetaJsonScheme> {
  return withMemCache(
    {
      key: "posts-meta",
      expireSeconds: 60,
      useRedis: true,
      redisExpire: 3600 * 24 * 7,
    },
    async () => {
      const res = await fetch(getBaseUrl() + "/cache/meta", {
        headers: buildHeaders(),
      });
      if (res.ok) {
        return res.json();
      }
      console.error(getRequestContext(), res);
      throw new Error("Failed to load posts meta cache");
    }
  );
}

export async function loadRenderPostCache(
  lang: string,
  slug: string
): Promise<RenderPost> {
  const posts = await loadPostsMetaCache();
  const meta = getPostMeta(posts, lang, slug);
  return withMemCache(
    {
      key: `post/${lang}/${slug}/${meta.md5}`,
      expireSeconds: 3600 * 24,
    },
    async () => {
      const res = await fetch(
        getBaseUrl() + `/cache/post/${lang}/${slug}/${meta.md5}`,
        {
          headers: buildHeaders(),
        }
      );
      if (res.ok) {
        return res.json();
      }
      console.error(getRequestContext(), res);
      throw new Error("Failed to load post cache");
    }
  );
}

export function purgePostsMetaCache() {
  purgeMemCache("posts-meta", true);
}
