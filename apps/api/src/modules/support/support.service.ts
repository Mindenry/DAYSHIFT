import { Injectable } from "@nestjs/common";
import { Prisma } from "@dayshift/db";
import { PrismaService } from "../../prisma/prisma.module";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../audit/audit.service";
import { AppError } from "../../common/app-error";
import { getPaging, paged } from "../../common/pagination";
import { AuthUser } from "../../common/types";

export interface CreateTicketInput {
  subject: string;
  description: string;
  orderId?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
}

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  private async ticketNumber() {
    return `TKT-${Date.now().toString().slice(-9)}`;
  }

  async create(user: AuthUser, input: CreateTicketInput) {
    if (input.orderId) {
      const order = await this.prisma.order.findFirst({
        where: { id: input.orderId, userId: user.id },
        select: { id: true },
      });
      if (!order) throw AppError.validation("That order does not belong to your account.");
    }
    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber: await this.ticketNumber(),
        userId: user.id,
        orderId: input.orderId || null,
        subject: input.subject,
        description: input.description,
        priority: input.priority ?? "NORMAL",
        status: "OPEN",
        messages: {
          create: {
            authorType: "CUSTOMER",
            authorId: user.id,
            body: input.description,
          },
        },
      },
    });
    return this.detailForCustomer(user.id, ticket.id);
  }

  async listForCustomer(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    });
    return tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      messageCount: ticket._count.messages,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    }));
  }

  async detailForCustomer(userId: string, id: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, userId },
      include: {
        order: { select: { orderNumber: true, id: true } },
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!ticket) throw AppError.notFound("Ticket not found");
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      order: ticket.order,
      createdAt: ticket.createdAt,
      messages: ticket.messages.map((message) => ({
        id: message.id,
        authorType: message.authorType,
        body: message.body,
        createdAt: message.createdAt,
      })),
    };
  }

  async addCustomerMessage(user: AuthUser, ticketId: string, body: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId: user.id },
    });
    if (!ticket) throw AppError.notFound("Ticket not found");
    if (ticket.status === "CLOSED") throw AppError.conflict("This ticket is closed.");
    await this.prisma.$transaction([
      this.prisma.ticketMessage.create({
        data: { ticketId, authorType: "CUSTOMER", authorId: user.id, body },
      }),
      this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: "WAITING_FOR_INTERNAL_TEAM" },
      }),
    ]);
    return this.detailForCustomer(user.id, ticketId);
  }

  // ── Staff ─────────────────────────────────────────────────────────────
  async adminList(query: { status?: string; q?: string; page?: number; pageSize?: number }) {
    const { page, pageSize, skip, take } = getPaging(query, 25);
    const where: Prisma.SupportTicketWhereInput = {
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.q
        ? {
            OR: [
              { ticketNumber: { contains: query.q, mode: "insensitive" } },
              { subject: { contains: query.q, mode: "insensitive" } },
              { user: { email: { contains: query.q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const [total, tickets] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        skip,
        take,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
          order: { select: { orderNumber: true } },
          _count: { select: { messages: true } },
        },
      }),
    ]);
    return paged(
      tickets.map((ticket) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        customer: ticket.user
          ? `${ticket.user.firstName} ${ticket.user.lastName}`
          : "Guest",
        email: ticket.user?.email ?? null,
        orderNumber: ticket.order?.orderNumber ?? null,
        assignedTo: ticket.assignedTo
          ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
          : null,
        messageCount: ticket._count.messages,
        updatedAt: ticket.updatedAt,
      })),
      total,
      page,
      pageSize,
    );
  }

  async adminDetail(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        order: { select: { id: true, orderNumber: true, status: true, grandTotal: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!ticket) throw AppError.notFound("Ticket not found");
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      customer: ticket.user,
      assignedTo: ticket.assignedTo,
      order: ticket.order,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      messages: ticket.messages.map((message) => ({
        id: message.id,
        authorType: message.authorType,
        author: message.author ? `${message.author.firstName} ${message.author.lastName}` : "System",
        body: message.body,
        isInternal: message.isInternal,
        createdAt: message.createdAt,
      })),
    };
  }

  async reply(
    actor: { id: string; email: string },
    ticketId: string,
    body: string,
    isInternal: boolean,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });
    if (!ticket) throw AppError.notFound("Ticket not found");
    if (ticket.status === "CLOSED") throw AppError.conflict("This ticket is closed.");

    const message = await this.prisma.ticketMessage.create({
      data: { ticketId, authorType: "STAFF", authorId: actor.id, body, isInternal },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    if (!isInternal) {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: "WAITING_FOR_CUSTOMER" },
      });
      if (ticket.userId && ticket.user) {
        await this.notifications.email({
          userId: ticket.userId,
          to: ticket.user.email,
          template: "support-reply",
          data: {
            subject: ticket.subject,
            body,
            url: `${process.env.APP_URL ?? "http://localhost:3000"}/account/support/${ticket.id}`,
          },
          dedupeKey: `support-reply:${message.id}`,
        });
        await this.notifications.inApp({
          userId: ticket.userId,
          template: "support.reply",
          subject: `Reply to ${ticket.subject}`,
          body,
          dedupeKey: `support-reply-inapp:${message.id}`,
        });
      }
    }
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: isInternal ? "ticket.internal_note" : "ticket.replied",
      entityType: "SupportTicket",
      entityId: ticketId,
      after: { messageId: message.id },
    });
    return this.adminDetail(ticketId);
  }

  async update(
    actor: { id: string; email: string },
    ticketId: string,
    input: { status?: string; priority?: string; assignedToId?: string | null },
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw AppError.notFound("Ticket not found");
    if (input.assignedToId) {
      const staff = await this.prisma.staffProfile.findUnique({ where: { userId: input.assignedToId } });
      if (!staff) throw AppError.validation("Assignee is not a staff member.");
    }
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(input.status ? { status: input.status as never } : {}),
        ...(input.priority ? { priority: input.priority as never } : {}),
        ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
        ...(input.status === "RESOLVED" || input.status === "CLOSED"
          ? { resolvedAt: new Date() }
          : {}),
      },
    });
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "ticket.updated",
      entityType: "SupportTicket",
      entityId: ticketId,
      before: { status: ticket.status, priority: ticket.priority },
      after: input,
    });
    return this.adminDetail(ticketId);
  }
}
