import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withUser } from "@/lib/api";
import { triggerAutomationNow } from "@/lib/queue";
import { getTotalCredits } from "@/lib/credits";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return withUser(async (userId) => {
    const automation = await prisma.automation.findFirst({
      where: { id, userId },
      select: { id: true, status: true },
    });
    if (!automation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (automation.status !== "active") {
      return NextResponse.json(
        { error: "Automation is not active" },
        { status: 409 },
      );
    }

    const total = await getTotalCredits(userId);
    if (total <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits", code: "INSUFFICIENT_CREDITS" },
        { status: 402 },
      );
    }

    try {
      const result = await triggerAutomationNow(id);
      return NextResponse.json(
        { ok: true, mode: result.mode, automationId: id },
        { status: 202 },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          { error: "Insufficient credits", code: "INSUFFICIENT_CREDITS" },
          { status: 402 },
        );
      }
      throw err;
    }
  });
}
