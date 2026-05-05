import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withUser } from "@/lib/api";
import { automationPatchSchema } from "@/lib/schemas";
import { scheduleAutomation, unscheduleAutomation } from "@/lib/queue";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return withUser(async (userId) => {
    const automation = await prisma.automation.findFirst({
      where: { id, userId },
      include: {
        schedules: true,
        collection: true,
        tiktokAccount: true,
        _count: { select: { slideshows: true } },
      },
    });
    if (!automation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return { automation };
  });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return withUser(async (userId) => {
    const existing = await prisma.automation.findFirst({
      where: { id, userId },
      include: { schedules: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const json = await req.json();
    const parsed = automationPatchSchema.parse(json);

    if ("action" in parsed) {
      const newStatus = parsed.action === "pause" ? "paused" : "active";
      const automation = await prisma.automation.update({
        where: { id },
        data: { status: newStatus },
      });
      return { automation };
    }

    const data = parsed;

    // Diff schedules so we re-register only what changed.
    const incoming = data.schedules?.map((s) => s.cron);
    if (incoming) {
      const existingCrons = existing.schedules.map((s) => s.cron);
      const toRemove = existing.schedules.filter((s) => !incoming.includes(s.cron));
      const toAdd = incoming.filter((c) => !existingCrons.includes(c));

      await Promise.all(
        toRemove.map(async (s) => {
          await unscheduleAutomation(existing.id, s.cron);
          await prisma.schedule.delete({ where: { id: s.id } });
        }),
      );

      for (const cron of toAdd) {
        const { jobId } = await scheduleAutomation(existing.id, cron);
        await prisma.schedule.create({
          data: { automationId: existing.id, cron, jobId },
        });
      }
    }

    const automation = await prisma.automation.update({
      where: { id },
      data: {
        title: data.title,
        niche: data.niche === "" ? null : data.niche,
        language: data.language,
        numOfSlides: data.numOfSlides,
        hooks: data.hooks,
        stylePrompt: data.stylePrompt,
        imageSource: data.imageSource,
        collectionId: data.collectionId === "" ? null : data.collectionId,
        tiktokAccountId: data.tiktokAccountId === "" ? null : data.tiktokAccountId,
        autoPost: data.autoPost,
        postMode: data.postMode,
        visibility: data.visibility,
        captionMode: data.captionMode,
        captionPrompt: data.captionPrompt,
        captionStatic: data.captionStatic,
      },
      include: { schedules: true },
    });
    return { automation };
  });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return withUser(async (userId) => {
    const existing = await prisma.automation.findFirst({
      where: { id, userId },
      include: { schedules: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await Promise.all(
      existing.schedules.map((s) => unscheduleAutomation(existing.id, s.cron)),
    );

    await prisma.automation.delete({ where: { id } });
    return { ok: true };
  });
}
