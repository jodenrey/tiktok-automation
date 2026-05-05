import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withUser } from "@/lib/api";
import { automationInputSchema } from "@/lib/schemas";
import { scheduleAutomation } from "@/lib/queue";

export async function GET() {
  return withUser(async (userId) => {
    const automations = await prisma.automation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { schedules: true, _count: { select: { slideshows: true } } },
    });
    return { automations };
  });
}

export async function POST(req: Request) {
  return withUser(async (userId) => {
    const json = await req.json();
    const data = automationInputSchema.parse(json);

    const automation = await prisma.automation.create({
      data: {
        userId,
        title: data.title,
        niche: data.niche || null,
        language: data.language,
        numOfSlides: data.numOfSlides,
        hooks: data.hooks,
        stylePrompt: data.stylePrompt,
        imageSource: data.imageSource,
        collectionId: data.collectionId || null,
        tiktokAccountId: data.tiktokAccountId || null,
        autoPost: data.autoPost,
        postMode: data.postMode,
        visibility: data.visibility,
        captionMode: data.captionMode,
        captionPrompt: data.captionPrompt,
        captionStatic: data.captionStatic || null,
        schedules: { create: data.schedules.map((s) => ({ cron: s.cron })) },
      },
      include: { schedules: true },
    });

    // Try to register schedules in BullMQ; ignore failures so the row still exists.
    for (const s of automation.schedules) {
      try {
        const { jobId } = await scheduleAutomation(automation.id, s.cron);
        if (jobId) {
          await prisma.schedule.update({
            where: { id: s.id },
            data: { jobId },
          });
        }
      } catch (err) {
        console.error("[automations] failed to schedule", s.cron, err);
      }
    }

    return NextResponse.json({ automation }, { status: 201 });
  });
}
