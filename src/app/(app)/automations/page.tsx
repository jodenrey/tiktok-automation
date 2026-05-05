import Link from "next/link";
import { Plus, PlayCircle, PauseCircle } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { describeCron, formatRelative } from "@/lib/utils";

export default async function AutomationsPage() {
  const session = await auth();
  const userId = (session?.user as { id: string }).id;

  const automations = await prisma.automation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      schedules: true,
      _count: { select: { slideshows: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Automations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recurring TikTok content runs on autopilot.
          </p>
        </div>
        <Button asChild variant="primary">
          <Link href="/automations/new">
            <Plus className="h-4 w-4" /> New automation
          </Link>
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {automations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              No automations yet. Create your first one to get started.
            </CardContent>
          </Card>
        ) : (
          automations.map((a) => (
            <Link
              key={a.id}
              href={`/automations/${a.id}`}
              className="block rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{a.title}</h3>
                    {a.status === "active" ? (
                      <Badge variant="success">
                        <PlayCircle className="mr-1 h-3 w-3" /> Active
                      </Badge>
                    ) : a.status === "paused" ? (
                      <Badge variant="warning">
                        <PauseCircle className="mr-1 h-3 w-3" /> Paused
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Out of credits</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.niche ?? "Mixed niche"} · {a.numOfSlides} slides ·{" "}
                    {a._count.slideshows} generated · created {formatRelative(a.createdAt)}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  {a.schedules.slice(0, 3).map((s) => (
                    <div key={s.id}>{describeCron(s.cron)}</div>
                  ))}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
