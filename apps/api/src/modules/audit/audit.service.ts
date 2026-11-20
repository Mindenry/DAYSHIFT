import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.module";

export interface AuditEntry {
  actorType?: "CUSTOMER" | "STAFF" | "SYSTEM";
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger("Audit");
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorType: entry.actorType ?? "SYSTEM",
          actorId: entry.actorId ?? null,
          actorEmail: entry.actorEmail ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          before: entry.before === undefined ? undefined : (entry.before as object),
          after: entry.after === undefined ? undefined : (entry.after as object),
          ip: entry.ip,
          userAgent: entry.userAgent,
        },
      });
    } catch (error) {
      // Audit failures must be visible but must not roll back a committed
      // business action such as a refund or shipment.
      this.logger.error(`Audit write failed for ${entry.action}: ${(error as Error).message}`);
    }
  }
}
