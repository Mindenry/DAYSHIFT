import { Controller, Get, Inject } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators";
import { PrismaService } from "../../prisma/prisma.module";
import { REDIS } from "../../redis/redis.module";
import { QUEUE_NAME } from "../../queue/queue.module";
import { redisConnectionOptions } from "../../queue/redis-connection";
import type Redis from "ioredis";
import { Queue } from "bullmq";
import { ConfigService } from "@nestjs/config";

@ApiTags("health")
@Public()
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  async health() {
    const started = Date.now();
    let database = "down";
    let redis = "down";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      /* reported below */
    }
    try {
      const pong = await this.redis.ping();
      redis = pong === "PONG" ? "up" : "degraded";
    } catch {
      /* reported below */
    }
    return {
      status: database === "up" && redis === "up" ? "ok" : "degraded",
      service: "dayshift-api",
      version: "1.0.0",
      environment: this.config.get("NODE_ENV") ?? "development",
      checks: { database, redis },
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    };
  }

  @Get("detailed")
  async detailed() {
    const base = await this.health();
    const queue = new Queue(QUEUE_NAME, {
      connection: redisConnectionOptions(this.config.get("REDIS_URL") ?? "redis://localhost:6380"),
    });
    let counts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    try {
      counts = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed") as typeof counts;
    } finally {
      await queue.close().catch(() => undefined);
    }
    return {
      ...base,
      queue: counts,
      uptimeSeconds: Math.round(process.uptime()),
      memory: process.memoryUsage(),
    };
  }
}
