import { Inject, Injectable } from "@nestjs/common";
import type Redis from "ioredis";
import { REDIS } from "./redis.constants";

@Injectable()
export class CacheService {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      /* cache is best-effort */
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    try {
      await this.redis.del(...keys);
    } catch {
      /* ignore */
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    try {
      let cursor = "0";
      do {
        const [next, keys] = await this.redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 200);
        cursor = next;
        if (keys.length) await this.redis.del(...keys);
      } while (cursor !== "0");
    } catch {
      /* ignore */
    }
  }
}
