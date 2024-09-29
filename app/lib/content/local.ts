import fs from "node:fs";
import { join } from "node:path";
import { ContentApi, FileNotFoundError } from "./base";
import serverConfig from "~/config.server";

const localContentApi: ContentApi = {
  metaDir: ".meta.local",
  async readFile(path) {
    path = join(serverConfig.localContentDir, path);
    if (!fs.existsSync(path)) {
      throw FileNotFoundError;
    }
    return (await fs.promises.readFile(path)).toString();
  },
};

export default localContentApi;
