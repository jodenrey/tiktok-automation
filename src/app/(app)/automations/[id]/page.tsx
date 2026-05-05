import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ImageIcon,
  PlayCircle,
  PauseCircle,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { describeCron, formatRelative } from "@/lib/utils";
import { AutomationActions } from "@/components/automation-actions";

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id: string }).id;

  const automation = await prisma.automation.findFirst({
    where: { id, userId },
    include: {
      schedules: true,
      collection: true,
      tiktokAccount: true,
      slideshows: {
        orderBy: { createdAt: "desc" },
        take: 12,
        include: {
          slides: { orderBy: { index: "asc" }, take: 1 },
          post: true,
        },
      },
      _count: { select: { slideshows: true } },
    },
  });

  if (!automation) notFound();

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {automation.title}
            </h1>
            {automation.status === "active" ? (
              <Badge variant="success">
                <PlayCircle className="mr-1 h-3 w-3" /> Active
              </Badge>
            ) : automation.status === "paused" ? (
              <Badge variant="warning">
                <PauseCircle className="mr-1 h-3 w-3" /> Paused
              </Badge>
            ) : (
              <Badge variant="destructive">Out of credits</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {automation.niche ?? "Mixed niche"} · {automation.numOfSlides} slides ·{" "}
            {automation._count.slideshows} generated
          </p>
        </div>
        <AutomationActions
          automationId={automation.id}
          status={automation.status}
        />
      </div>

      {/* Config */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>All times in PST.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {automation.schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span>{describeCron(s.cron)}</span>
                <code className="text-xs text-muted-foreground">{s.cron}</code>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hooks</CardTitle>
            <CardDescription>
              {automation.hooks.length} topic{automation.hooks.length === 1 ? "" : "s"} in rotation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            {automation.hooks.map((h, i) => (
              <Badge key={i} variant="outline">
                {h}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Style prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
            {automation.stylePrompt}
          </pre>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Image source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm capitalize">{automation.imageSource}</div>
            {automation.collection && (
              <div className="text-xs text-muted-foreground">
                Collection: {automation.collection.name}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">TikTok</CardTitle>
          </CardHeader>
          <CardContent>
            {automation.tiktokAccount ? (
              <div className="text-sm">@{automation.tiktokAccount.accountUsername}</div>
            ) : (
              <div className="text-sm text-muted-foreground">Not connected</div>
            )}
            <div className="text-xs text-muted-foreground">
              {automation.autoPost ? "Auto-publish" : "Draft only"} · {automation.postMode}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Caption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm capitalize">{automation.captionMode}</div>
            <div className="text-xs text-muted-foreground line-clamp-2">
              {automation.captionMode === "prompt"
                ? automation.captionPrompt
                : automation.captionStatic ?? "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-10" />

      <h2 className="text-lg font-semibold">Recent posts</h2>
      {automation.slideshows.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No slideshows yet. Click <b>Run now</b> above to generate one immediately.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {automation.slideshows.map((s) => {
            const cover = s.slides[0]?.imageUrl;
            return (
              <Link
                key={s.id}
                href={`/posts/${s.id}`}
                className="group block overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-colors hover:bg-white/[0.04]"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/40">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={s.hook ?? "slideshow"}
                      className="h-full w-full object-cover opacity-90 transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-xs text-white">
                    <div className="line-clamp-2 font-medium">{s.hook ?? "Untitled"}</div>
                    <div className="mt-0.5 text-white/60">
                      {formatRelative(s.createdAt)}
                    </div>
                  </div>
                  <div className="absolute right-2 top-2">
                    <Badge
                      variant={
                        s.status === "completed"
                          ? "success"
                          : s.status === "failed"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
