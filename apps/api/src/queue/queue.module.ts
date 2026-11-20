import { Global, Injectable, Logger, Module, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue, JobsOptions } from "bullmq";
import { redisConnectionOptions } from "./redis-connection";

export const JOBS = "DAYSHIFT_JOBS";
export const QUEUE_NAME = "dayshift";

@Injectable()
export class JobService implements OnModuleDestroy {
  private readonly logger = new Logger("Jobs");
  constructor(private readonly queue: Queue) {}

  async add(name: string, data: Record<string, unknown>, options?: JobsOptions) {
    try {
      // BullMQ custom ids may not contain colons (used by dedupe keys and
      // return numbers). Normalise while preserving uniqueness.
      const jobId = options?.jobId
        ? String(options.jobId).replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 120)
        : undefined;
      return await this.queue.add(name, data, {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: { age: 604800 },
        ...options,
        ...(jobId ? { jobId } : {}),
      });
    } catch (error) {
      // Queue outages must not break the customer-facing transaction. The
      // notification row stays PENDING and the reconciliation job retries it.
      this.logger.warn(`Could not enqueue ${name}: ${(error as Error).message}`);
      return null;
    }
  }

  async onModuleDestroy() {
    await this.queue.close().catch(() => undefined);
  }
}

@Global()
@Module({
  providers: [
    {
      provide: JOBS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("REDIS_URL") ?? "redis://localhost:6380";
        return new Queue(QUEUE_NAME, {
          connection: redisConnectionOptions(url),
          defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 2000 } },
        });
      },
    },
    {
      provide: JobService,
      inject: [JOBS],
      useFactory: (queue: Queue) => new JobService(queue),
    },
  ],
  exports: [JOBS, JobService],
})
export class QueueModule {}
