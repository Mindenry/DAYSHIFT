import { Injectable } from "@nestjs/common";
import { Prisma } from "@dayshift/db";
import { COMMERCE } from "@dayshift/config";
import { PrismaService } from "../../prisma/prisma.module";

type Tx = Prisma.TransactionClient;

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  private tierFor(lifetimePoints: number) {
    const tiers = [...COMMERCE.loyalty.tiers].reverse();
    return tiers.find((tier) => lifetimePoints >= tier.threshold)?.tier ?? "BRONZE";
  }

  /** Awards points once per order. Safe to call from a retried payment event. */
  async awardForOrder(tx: Tx, userId: string, orderId: string, merchandiseCents: number) {
    const existing = await tx.loyaltyTransaction.findFirst({
      where: { orderId, type: "EARN" },
    });
    if (existing) return existing;

    const account = await tx.loyaltyAccount.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    const points = Math.floor((merchandiseCents / 100) * COMMERCE.loyalty.pointsPerDollar);
    if (points <= 0) return null;
    const lifetime = account.lifetimePoints + points;
    const updated = await tx.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        pointsBalance: account.pointsBalance + points,
        lifetimePoints: lifetime,
        tier: this.tierFor(lifetime) as "BRONZE" | "SILVER" | "GOLD" | "PLATINUM",
      },
    });
    const transaction = await tx.loyaltyTransaction.create({
      data: {
        accountId: account.id,
        type: "EARN",
        points,
        reason: `Order ${orderId}`,
        orderId,
      },
    });
    return { transaction, account: updated, tierChanged: updated.tier !== account.tier };
  }

  async redeem(userId: string, points: number, orderId?: string) {
    if (points < COMMERCE.loyalty.minRedeemPoints) {
      throw new Error(`Minimum redemption is ${COMMERCE.loyalty.minRedeemPoints} points.`);
    }
    const account = await this.prisma.loyaltyAccount.findUnique({ where: { userId } });
    if (!account || account.pointsBalance < points) throw new Error("Not enough points.");
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: { pointsBalance: account.pointsBalance - points },
      });
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: "REDEEM",
          points: -points,
          reason: "Points redemption",
          orderId,
        },
      });
      return { account: updated, transaction, valueCents: points * COMMERCE.loyalty.centsPerPoint };
    });
  }

  async accountFor(userId: string) {
    return this.prisma.loyaltyAccount.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async summary(userId: string) {
    const account = await this.accountFor(userId);
    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const nextTier = COMMERCE.loyalty.tiers.find((tier) => tier.threshold > account.lifetimePoints);
    return {
      ...account,
      valueCents: account.pointsBalance * COMMERCE.loyalty.centsPerPoint,
      nextTier: nextTier
        ? { tier: nextTier.tier, threshold: nextTier.threshold, pointsToGo: nextTier.threshold - account.lifetimePoints }
        : null,
      transactions,
    };
  }
}
