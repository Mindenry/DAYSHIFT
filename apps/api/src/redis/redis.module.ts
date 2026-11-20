import {
  Global,
  Inject,
  Injectable,
  Logger,
  Module,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { CacheService } from "./cache.service";
import { REDIS } from "./redis.constants";

export { REDIS };

@Injectable()
class RedisLifecycle implements OnModuleDestroy {
  private readonly logger = new Logger("Redis");
  constructor(@Inject(REDIS) private readonly client: Redis) {
    client.on("error", (error) => this.logger.error(`Redis error: ${error.message}`));
    client.on("connect", () => this.logger.log("Redis connected"));
  }
  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("REDIS_URL") ?? "redis://localhost:6380";
        return new Redis(url, {
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
          lazyConnect: false,
        });
      },
    },
    RedisLifecycle,
    CacheService,
  ],
  exports: [REDIS, CacheService],
})
export class RedisModule {}
