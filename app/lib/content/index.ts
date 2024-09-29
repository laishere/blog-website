import serverConfig from "~/config.server";
import type { MarkdownRenderResult } from "../md.server";
import {
  ExtendedPostMeta,
  FileNotFoundError,
  PostsMetaJsonScheme as PostsMetaJsonScheme,
} from "./base";
import githubContentApi from "./github";
import localContentApi from "./local";
import { join } from "node:path";

export { FileNotFoundError } from "./base";

type Post = {
  meta: ExtendedPostMeta;
  content: string;
};

export type RenderPost = {
  renderTime: number;
  meta: ExtendedPostMeta;
} & MarkdownRenderResult;

const isDev = import.meta.env.DEV;
const contentApi =
  isDev && serverConfig.localContentDir ? localContentApi : githubContentApi;

export async function loadPostsMeta() {
  const content = await contentApi.readFile(
    join(contentApi.metaDir, "posts.json")
  );
  return JSON.parse(content) as PostsMetaJsonScheme;
}

export function getPostMeta(
  posts: PostsMetaJsonScheme,
  lang: string,
  slug: string
) {
  if (!posts[slug]) {
    throw FileNotFoundError;
  }
  const post = posts[slug];
  const { langs, ...rest } = post;
  if (!langs[lang]) {
    throw FileNotFoundError;
  }
  return {
    lang,
    slug,
    ...rest,
    ...post.langs[lang],
    langs: Object.keys(post.langs),
  };
}

export async function readPost(meta: ExtendedPostMeta): Promise<Post> {
  const path = `${meta.path}/${meta.lang}.md`;
  const content = await contentApi.readFile(path);
  return { meta, content };
}

export async function getHomePosts(posts: PostsMetaJsonScheme, lang: string) {
  return Object.entries(posts)
    .map(([slug, post]) => {
      const { langs, ...rest } = post;
      if (!langs[lang]) {
        return null;
      }
      return {
        lang,
        slug,
        ...rest,
        ...langs[lang],
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => a.order - b.order);
}
