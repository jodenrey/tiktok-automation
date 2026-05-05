import { prisma } from "@/lib/prisma";

/** Total export credits remaining (monthly + one-time purchases). */
export async function getTotalCredits(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, purchasedCredits: true },
  });
  if (!user) return 0;
  return user.credits + user.purchasedCredits;
}

/**
 * Consumes one export credit: drains monthly credits first, then purchased.
 */
export async function consumeOneExportCredit(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, purchasedCredits: true },
  });
  if (!user || user.credits + user.purchasedCredits <= 0) {
    throw new Error("INSUFFICIENT_CREDITS");
  }
  if (user.credits > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 1 } },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { purchasedCredits: { decrement: 1 } },
    });
  }
}
