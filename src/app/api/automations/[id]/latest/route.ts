import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withUser } from "@/lib/api";

// Returns the newest slideshow for an automation, optionally filtered by createdAfter.
// Used by the UI to show progress after clicking "Run now".
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const createdAfter = url.searchParams.get("createdAfter");
  const createdAfterDate = createdAfter ? new Date(createdAfter) : null;

  return withUser(async (userId) => {
    const automation = await prisma.automation.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!automation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const slideshow = await prisma.slideshow.findFirst({
      where: {
        automationId: id,
        userId,
        ...(createdAfterDate
          ? {
              createdAt: {
                gt: createdAfterDate,
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        errorMessage: true,
      },
    });

    return { slideshow };
  });
}

