import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AutomationForm } from "@/components/automation-form";
import { Button } from "@/components/ui/button";

export default async function EditAutomationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id: string }).id;

  const [automation, collections, tiktokAccounts] = await Promise.all([
    prisma.automation.findFirst({
      where: { id, userId },
      include: { schedules: true },
    }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    prisma.tikTokAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, accountUsername: true },
    }),
  ]);

  if (!automation) notFound();

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href={`/automations/${automation.id}`}>
          <ArrowLeft className="h-4 w-4" /> Back to automation
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight">Edit automation</h1>

      <div className="mt-8">
        <AutomationForm
          collections={collections}
          tiktokAccounts={tiktokAccounts}
          initial={{
            id: automation.id,
            title: automation.title,
            niche: automation.niche ?? "",
            language: automation.language,
            numOfSlides: automation.numOfSlides,
            hooks: automation.hooks,
            stylePrompt: automation.stylePrompt,
            imageSource: automation.imageSource as "pinterest" | "unsplash" | "collection",
            collectionId: automation.collectionId,
            tiktokAccountId: automation.tiktokAccountId,
            autoPost: automation.autoPost,
            postMode: automation.postMode as "DIRECT_POST" | "MEDIA_UPLOAD",
            visibility: automation.visibility,
            captionMode: automation.captionMode as "prompt" | "static",
            captionPrompt: automation.captionPrompt,
            captionStatic: automation.captionStatic ?? "",
            schedules: automation.schedules.map((s) => ({ cron: s.cron })),
          }}
        />
      </div>
    </div>
  );
}
