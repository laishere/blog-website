import { ContentApi, FileNotFoundError } from "./base";
import serverConfig from "~/config.server";

const githubContentApi: ContentApi = {
  metaDir: ".meta",
  async readFile(path) {
    const url = `https://api.github.com/repos/${serverConfig.githubRepo}/contents/${path}?ref=meta`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${serverConfig.githubPAT}`,
        Accept: "application/vnd.github.raw+json",
        "User-Agent": "blog", // Must in worker environment
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) {
      if (res.status === 404) {
        throw FileNotFoundError;
      }
      console.error("Failed to fetch content:", res.statusText);
      throw new Error("Failed to fetch content");
    }
    return res.text();
  },
};

export default githubContentApi;
