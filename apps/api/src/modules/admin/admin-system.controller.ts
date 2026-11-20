import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { Queue } from "bullmq";
import type Redis from "ioredis";
import bcrypt from "bcryptjs";
import { Prisma } from "@dayshift/db";
import { PrismaService } from "../../prisma/prisma.module";
import { AdminDashboardService } from "./admin-dashboard.service";
import { AuditService } from "../audit/audit.service";
import { CacheService } from "../../redis/cache.service";
import { REDIS } from "../../redis/redis.module";
import { QUEUE_NAME } from "../../queue/queue.module";
import { redisConnectionOptions } from "../../queue/redis-connection";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CurrentUser, RequirePermissions } from "../../common/decorators";
import { AuthUser } from "../../common/types";
import { getPaging, paged } from "../../common/pagination";
import { AppError } from "../../common/app-error";
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class CreateStaffDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(1) @MaxLength(60) firstName!: string;
  @IsString() @MinLength(1) @MaxLength(60) lastName!: string;
  @IsString() @MinLength(10) @MaxLength(128) password!: string;
  @IsString() roleName!: string;
  @IsOptional() @IsString() @MaxLength(120) jobTitle?: string;
}

export class UpdateStaffDto {
  @IsOptional() @IsString() roleName?: string;
  @IsOptional() @IsString() @MaxLength(120) jobTitle?: string;
  @IsOptional() @Type(() => Boolean) @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() status?: string;
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/dashboard")
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get()
  @RequirePermissions("dashboard.read")
  metrics(@Query("from") from?: string, @Query("to") to?: string) {
    return this.dashboard.metrics(from, to);
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/staff")
export class AdminStaffController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("staff.manage")
  list() {
    return this.prisma.user.findMany({
      where: { staffProfile: { isNot: null } },
      orderBy: { firstName: "asc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        lastLoginAt: true,
        staffProfile: { include: { role: { select: { id: true, name: true } } } },
      },
    });
  }

  @Post()
  @RequirePermissions("staff.manage")
  async create(@CurrentUser() actor: AuthUser, @Body() dto: CreateStaffDto) {
    const role = await this.prisma.role.findUnique({ where: { name: dto.roleName } });
    if (!role) throw AppError.validation("Unknown role.");
    const code = `DS-EMP-${Date.now().toString().slice(-6)}`;
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.trim().toLowerCase(),
        passwordHash: await bcrypt.hash(dto.password, 12),
        firstName: dto.firstName,
        lastName: dto.lastName,
        emailVerifiedAt: new Date(),
        staffProfile: {
          create: { roleId: role.id, employeeCode: code, jobTitle: dto.jobTitle },
        },
      },
      include: { staffProfile: { include: { role: true } } },
    });
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "staff.created",
      entityType: "User",
      entityId: user.id,
      after: { email: user.email, role: role.name },
    });
    return { id: user.id, email: user.email, role: role.name, employeeCode: code };
  }

  @Patch(":id")
  @RequirePermissions("staff.manage")
  async update(@CurrentUser() actor: AuthUser, @Param("id") id: string, @Body() dto: UpdateStaffDto) {
    const staff = await this.prisma.staffProfile.findUnique({ where: { userId: id } });
    if (!staff) throw AppError.notFound("Staff member not found");
    if (dto.roleName) {
      const role = await this.prisma.role.findUnique({ where: { name: dto.roleName } });
      if (!role) throw AppError.validation("Unknown role.");
      await this.prisma.staffProfile.update({ where: { userId: id }, data: { roleId: role.id } });
    }
    if (dto.jobTitle !== undefined || dto.isActive !== undefined) {
      await this.prisma.staffProfile.update({
        where: { userId: id },
        data: {
          ...(dto.jobTitle !== undefined ? { jobTitle: dto.jobTitle } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });
    }
    if (dto.status) {
      await this.prisma.user.update({ where: { id }, data: { status: dto.status as never } });
    }
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "staff.updated",
      entityType: "User",
      entityId: id,
      after: dto,
    });
    return { updated: true };
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/roles")
export class AdminRolesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("roles.manage")
  list() {
    return this.prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { staff: true } },
      },
    });
  }

  @Get("permissions")
  @RequirePermissions("roles.manage")
  permissions() {
    return this.prisma.permission.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  }

  @Patch(":id/permissions")
  @RequirePermissions("roles.manage")
  async setPermissions(
    @CurrentUser() actor: AuthUser,
    @Param("id") id: string,
    @Body() body: { permissionKeys: string[] },
  ) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw AppError.notFound("Role not found");
    if (role.name === "SUPER_ADMIN") {
      throw AppError.forbidden("The super administrator permissions cannot be reduced.");
    }
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: body.permissionKeys } },
    });
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({ roleId: id, permissionId: permission.id })),
      }),
    ]);
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "role.permissions_updated",
      entityType: "Role",
      entityId: id,
      after: { permissionKeys: body.permissionKeys },
    });
    return { updated: true };
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/audit")
export class AdminAuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions("audit.read")
  async list(
    @Query("page") page?: string,
    @Query("action") action?: string,
    @Query("entityType") entityType?: string,
  ) {
    const paging = getPaging({ page }, 50);
    const where: Prisma.AuditLogWhereInput = {
      ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
      ...(entityType ? { entityType } : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.take,
      }),
    ]);
    return paged(items, total, paging.page, paging.pageSize);
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/settings")
export class AdminSettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("settings.manage")
  async list() {
    const rows = await this.prisma.setting.findMany({ orderBy: { key: "asc" } });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  @Patch()
  @RequirePermissions("settings.manage")
  async update(@CurrentUser() actor: AuthUser, @Body() body: Record<string, unknown>) {
    const allowed = ["store", "tax", "shipping", "returns", "loyalty", "payments", "notifications", "features"];
    for (const key of Object.keys(body)) {
      if (!allowed.includes(key)) throw AppError.validation(`Unknown setting: ${key}`);
      await this.prisma.setting.upsert({
        where: { key },
        update: { value: body[key] as Prisma.InputJsonValue },
        create: { key, value: body[key] as Prisma.InputJsonValue },
      });
    }
    await this.cache.del("settings:commerce");
    await this.cache.delByPrefix("catalog:");
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "settings.updated",
      entityType: "Setting",
      after: body,
    });
    return { updated: true };
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/reports")
export class AdminReportsController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get("sales")
  @RequirePermissions("reports.read")
  sales(@Query("from") from?: string, @Query("to") to?: string) {
    return this.dashboard.metrics(from, to);
  }

  @Get("sales.csv")
  @RequirePermissions("reports.export")
  async salesCsv(
    @Res() res: Response,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const metrics = await this.dashboard.metrics(from, to);
    const rows = [
      ["day", "orders", "gross_sales"],
      ...metrics.salesSeries.map((row) => [
        new Date(row.day).toISOString().slice(0, 10),
        String(row.orders),
        row.total,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="dayshift-sales-${Date.now()}.csv"`);
    res.send(csv);
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/system")
export class AdminSystemController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  @Get()
  @RequirePermissions("system.read")
  async status() {
    let database = "down";
    let redis = "down";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      /* noop */
    }
    try {
      redis = (await this.redis.ping()) === "PONG" ? "up" : "degraded";
    } catch {
      /* noop */
    }
    const queue = new Queue(QUEUE_NAME, {
      connection: redisConnectionOptions(this.config.get("REDIS_URL") ?? "redis://localhost:6380"),
    });
    let jobs = {};
    try {
      jobs = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
    } catch {
      /* noop */
    } finally {
      await queue.close().catch(() => undefined);
    }
    const [products, orders, customers, failedNotifications] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.customerProfile.count(),
      this.prisma.notification.count({ where: { status: "FAILED" } }),
    ]);
    return {
      service: "dayshift-api",
      version: "1.0.0",
      environment: this.config.get("NODE_ENV") ?? "development",
      database,
      redis,
      jobs,
      failedNotifications,
      counts: { products, orders, customers },
      uptimeSeconds: Math.round(process.uptime()),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}
