const env = import.meta.env;

const serverConfig = {
  localContentDir: env.VITE_LOCAL_CONTENT_DIR!,
  githubPAT: env.VITE_GITHUB_PAT!,
  githubRepo: env.VITE_GITHUB_REPO!,
  redisUrl: env.VITE_REDIS_URL,
  cachePurgeSecret: env.VITE_CACHE_PURGE_SECRET!,
  disableCache: import.meta.env.DEV,
};

export default serverConfig;
