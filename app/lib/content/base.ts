export type PostsMetaJsonScheme = Record<string, PostEntry>;

type PostEntry = PostMetaCommon & {
  langs: Record<string, PostMetaLang>;
};

type PostMetaCommon = {
  image: string;
  path: string;
  order: number;
  publishDate: string;
};

type PostMetaLang = {
  title: string;
  description: string;
  md5: string;
};

type PostMeta = PostMetaCommon & PostMetaLang;

export type ExtendedPostMeta = PostMeta & {
  lang: string;
  slug: string;
  langs: string[];
};

export type HomePost = {
  lang: string;
  slug: string;
  image: string;
  title: string;
  description: string;
  publishDate: string;
};

export interface ContentApi {
  metaDir: string;
  readFile(path: string): Promise<string>;
}

export const FileNotFoundError = Symbol("FileNotFoundError");
