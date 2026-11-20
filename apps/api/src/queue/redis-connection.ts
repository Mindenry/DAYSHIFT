export interface RedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db: number;
  maxRetriesPerRequest: null;
  enableReadyCheck: boolean;
}

/** BullMQ needs discrete connection options; a { url } object is ignored. */
export function redisConnectionOptions(urlValue: string): RedisConnectionOptions {
  const url = new URL(urlValue);
  return {
    host: url.hostname || "localhost",
    port: Number(url.port || 6379),
    ...(url.username ? { username: decodeURIComponent(url.username) } : {}),
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
    db: Number(url.pathname.replace("/", "") || 0),
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  };
}
