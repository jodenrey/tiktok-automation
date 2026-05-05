import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AutomationForm } from "@/components/automation-form";
import { Button } from "@/components/ui/button";

export default async function NewAutomationPage() {
  const session = await auth();
  const userId = (session?.user as { id: string }).id;

  const [collections, tiktokAccounts] = await Promise.all([
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

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight">New automation</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell tiktok-automation what to post, how often, and how it should sound.
      </p>

      <div className="mt-8">
        <AutomationForm
          collections={collections}
          tiktokAccounts={tiktokAccounts}
        />
      </div>
    </div>
  );
}
