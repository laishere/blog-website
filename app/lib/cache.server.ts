import serverConfig from "~/config.server";
import { hasRedis, redisDel, redisGet, redisSet } from "./redis.server";

const memCache = new Map<string, { expire: number; data: unknown }>();
const debounceMap = new Map<string, Promise<unknown>>();

async function successRace<T>(promises: Promise<T>[]): Promise<T> {
  const ret = await Promise.race(
    promises.map((p) =>
      p.then(
        (value) => ({ p, value }),
        (error) => ({ p, error })
      )
    )
  );
  if ("value" in ret) {
    return ret.value;
  }
  const rest = promises.filter((p) => p !== ret.p);
  if (rest.length === 0) {
    throw ret.error;
  }
  return successRace(rest);
}

type MemCacheOptions = {
  key: string;
  expireSeconds: number;
  useRedis?: boolean;
  redisExpire?: number;
  debounce?: boolean;
};

export async function withMemCache<T>(
  {
    key,
    expireSeconds,
    useRedis = false,
    debounce = true,
    redisExpire = expireSeconds,
  }: MemCacheOptions,
  load: () => Promise<T>
): Promise<T> {
  if (serverConfig.disableCache) {
    return load();
  }
  if (debounce && debounceMap.has(key)) {
    return debounceMap.get(key) as Promise<T>;
  }
  const task = (async () => {
    const now = Date.now();
    const cache = memCache.get(key);
    if (cache && cache.expire > now) {
      console.log("Memory cache hit:", key);
      return cache.data as T;
    }
    const tasks = [load()];
    const shouldUseRedis = useRedis && hasRedis();
    let shouldWriteRedis = shouldUseRedis;
    let resolved = false;
    if (shouldUseRedis) {
      tasks.push(
        (async () => {
          const redisGetStart = Date.now();
          const redisCache = await redisGet(key);
          if (!redisCache) {
            console.log("Redis cache miss:", key);
            throw new Error("Redis cache miss");
          }
          console.log(
            `Redis cache hit in ${Date.now() - redisGetStart}ms:`,
            key
          );
          shouldWriteRedis = false; // No need to write back to Redis
          if (resolved) {
            console.warn("Redis is slower than load:", key);
          }
          return JSON.parse(redisCache);
        })()
      );
    }
    const data = await successRace(tasks);
    resolved = true;
    memCache.set(key, { expire: now + expireSeconds * 1000, data });
    if (shouldWriteRedis) {
      const redisSetStart = Date.now();
      redisSet(key, JSON.stringify(data), redisExpire)
        .then(() => {
          console.log(`Redis write time ${Date.now() - redisSetStart}ms:`, key);
        })
        .catch(console.error);
    }
    return data;
  })();
  debounceMap.set(key, task);
  return task.finally(() => {
    debounceMap.delete(key);
  });
}

export async function purgeMemCache(key: string, includeRedis: boolean) {
  memCache.delete(key);
  if (includeRedis && hasRedis()) {
    await redisDel(key).catch(console.error);
  }
}
