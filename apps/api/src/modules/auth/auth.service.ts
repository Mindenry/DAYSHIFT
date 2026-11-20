import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.module";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../audit/audit.service";
import { AppError } from "../../common/app-error";
import { AuthUser } from "../../common/types";
import { randomToken, sha256 } from "../../common/crypto";
import { REDIS } from "../../redis/redis.module";
import type Redis from "ioredis";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from "./auth.dto";

const SESSION_DAYS = 30;
const MAX_LOGIN_FAILURES = 6;
const LOGIN_WINDOW_SECONDS = 900;

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger("Auth");
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  private appUrl() {
    return this.config.get<string>("APP_URL") ?? "http://localhost:3000";
  }

  private async createSession(userId: string, meta: RequestMeta) {
    const token = randomToken(32);
    await this.prisma.session.create({
      data: {
        tokenHash: sha256(token),
        userId,
        ip: meta.ip,
        userAgent: meta.userAgent?.slice(0, 255),
        expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
      },
    });
    return token;
  }

  private async failureKey(email: string, meta: RequestMeta) {
    const ip = meta.ip ?? "unknown";
    return `auth:fail:${email.toLowerCase()}:${ip}`;
  }

  private async assertNotLocked(email: string, meta: RequestMeta) {
    try {
      const key = await this.failureKey(email, meta);
      const count = Number((await this.redis.get(key)) ?? 0);
      if (count >= MAX_LOGIN_FAILURES) {
        throw AppError.tooMany("Too many sign-in attempts. Try again in 15 minutes.");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      // Redis outage should not block authentication; database verification still applies.
    }
  }

  private async recordFailure(email: string, meta: RequestMeta) {
    try {
      const key = await this.failureKey(email, meta);
      const count = await this.redis.incr(key);
      if (count === 1) await this.redis.expire(key, LOGIN_WINDOW_SECONDS);
    } catch {
      /* non-fatal */
    }
  }

  private async clearFailures(email: string, meta: RequestMeta) {
    try {
      await this.redis.del(await this.failureKey(email, meta));
    } catch {
      /* non-fatal */
    }
  }

  private publicUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    emailVerifiedAt: Date | null;
    createdAt: Date;
    staffProfile?: { role: { name: string; permissions: { permission: { key: string } }[] } } | null;
  }) {
    const permissions = user.staffProfile?.role.permissions.map((p) => p.permission.key) ?? [];
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      kind: user.staffProfile ? "staff" : "customer",
      staffRole: user.staffProfile?.role.name,
      permissions,
    };
  }

  async register(dto: RegisterDto, meta: RequestMeta) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw AppError.conflict("An account with that email already exists.");
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        customerProfile: { create: { marketingOptIn: dto.marketingOptIn ?? false } },
        loyaltyAccount: { create: {} },
      },
    });

    await this.sendVerification(user.id, user.email, user.firstName);
    await this.notifications.email({
      userId: user.id,
      to: user.email,
      template: "welcome",
      data: { firstName: user.firstName, url: `${this.appUrl()}/account` },
      dedupeKey: `welcome:${user.id}`,
    });

    const token = await this.createSession(user.id, meta);
    await this.audit.log({
      actorType: "CUSTOMER",
      actorId: user.id,
      actorEmail: user.email,
      action: "customer.registered",
      entityType: "User",
      entityId: user.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return { user: this.publicUser(user), token };
  }

  async login(dto: LoginDto, meta: RequestMeta) {
    const email = dto.email.trim().toLowerCase();
    await this.assertNotLocked(email, meta);
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        staffProfile: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      await this.recordFailure(email, meta);
      throw AppError.unauthorized("Invalid email or password.");
    }
    if (user.status !== "ACTIVE") {
      throw AppError.forbidden("This account is not available. Contact support.");
    }
    await this.clearFailures(email, meta);
    const token = await this.createSession(user.id, meta);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { user: this.publicUser(user), token };
  }

  async staffLogin(dto: LoginDto, meta: RequestMeta) {
    const email = dto.email.trim().toLowerCase();
    await this.assertNotLocked(email, meta);
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        staffProfile: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      await this.recordFailure(email, meta);
      throw AppError.unauthorized("Invalid credentials.");
    }
    if (!user.staffProfile || !user.staffProfile.isActive) {
      throw AppError.forbidden("This account does not have staff access.");
    }
    if (user.status !== "ACTIVE") throw AppError.forbidden("This account is suspended.");
    await this.clearFailures(email, meta);
    const token = await this.createSession(user.id, meta);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit.log({
      actorType: "STAFF",
      actorId: user.id,
      actorEmail: user.email,
      action: "staff.signed_in",
      entityType: "User",
      entityId: user.id,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return { user: this.publicUser(user), token };
  }

  async resolveSession(token: string): Promise<AuthUser | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: sha256(token) },
      include: {
        user: {
          include: {
            staffProfile: {
              include: { role: { include: { permissions: { include: { permission: true } } } } },
            },
          },
        },
      },
    });
    if (!session) return null;
    if (session.revokedAt || session.expiresAt < new Date()) return null;
    if (session.user.status !== "ACTIVE") return null;
    if (session.user.staffProfile && !session.user.staffProfile.isActive) return null;

    if (Date.now() - session.lastActiveAt.getTime() > 5 * 60_000) {
      void this.prisma.session
        .update({ where: { id: session.id }, data: { lastActiveAt: new Date() } })
        .catch(() => undefined);
    }

    const permissions = session.user.staffProfile?.role.permissions.map((p) => p.permission.key) ?? [];
    return {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      kind: session.user.staffProfile ? "staff" : "customer",
      staffRole: session.user.staffProfile?.role.name,
      permissions,
      sessionId: session.id,
      emailVerified: !!session.user.emailVerifiedAt,
    };
  }

  async logout(token: string | undefined) {
    if (!token) return;
    await this.prisma.session.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        staffProfile: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        customerProfile: true,
        loyaltyAccount: true,
      },
    });
    if (!user) throw AppError.notFound("Account not found");
    return {
      ...this.publicUser(user),
      customerProfile: user.customerProfile,
      loyalty: user.loyaltyAccount,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
      },
    });
    return this.publicUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto, sessionId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("Account not found");
    if (!(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw AppError.validation("Your current password is incorrect.");
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.session.updateMany({
        where: { userId, id: { not: sessionId }, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.audit.log({
      actorType: "CUSTOMER",
      actorId: userId,
      actorEmail: user.email,
      action: "customer.password_changed",
      entityType: "User",
      entityId: userId,
    });
    return { changed: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = randomToken(32);
      await this.prisma.passwordResetToken.create({
        data: {
          tokenHash: sha256(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });
      await this.notifications.email({
        userId: user.id,
        to: user.email,
        template: "password-reset",
        data: { url: `${this.appUrl()}/account/reset-password?token=${token}`, firstName: user.firstName },
        dedupeKey: `password-reset:${user.id}:${Date.now()}`,
      });
    }
    // Always return the same response to avoid account enumeration.
    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: sha256(dto.token) },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw AppError.validation("This reset link is invalid or has expired.");
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      this.prisma.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { reset: true };
  }

  async sendVerification(userId: string, email: string, firstName: string) {
    const token = randomToken(32);
    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash: sha256(token),
        userId,
        expiresAt: new Date(Date.now() + 24 * 3_600_000),
      },
    });
    await this.notifications.email({
      userId,
      to: email,
      template: "verify-email",
      data: { firstName, url: `${this.appUrl()}/account/verify-email?token=${token}` },
      dedupeKey: `verify:${userId}:${Date.now()}`,
    });
    return { sent: true };
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: sha256(token) },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw AppError.validation("This verification link is invalid or has expired.");
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
      this.prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    return { verified: true };
  }

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: "desc" },
    });
    return sessions.map((s) => ({
      id: s.id,
      ip: s.ip,
      userAgent: s.userAgent,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      current: s.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw AppError.notFound("Session not found");
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
    return { revoked: true };
  }

  async requireVerifiedEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true, staffProfile: { select: { id: true } } },
    });
    if (!user?.emailVerifiedAt && !user?.staffProfile) {
      throw new AppError(
        "EMAIL_NOT_VERIFIED",
        "Verify your email address before continuing.",
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
