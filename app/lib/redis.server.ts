import { Redis } from "ioredis";
import serverConfig from "~/config.server";

let client: Redis | undefined;

export function hasRedis() {
  return serverConfig.redisUrl !== undefined;
}

function requireRedis() {
  if (client) {
    return client;
  }
  if (!hasRedis()) {
    throw new Error("Redis is not configured");
  }
  client = new Redis(serverConfig.redisUrl);
  return client;
}

export function redisGet(key: string) {
  return requireRedis().get(key);
}

export function redisSet(key: string, value: string, ex: number) {
  return requireRedis().set(key, value, "EX", ex);
}

export function redisDel(key: string) {
  return requireRedis().del(key);
}
