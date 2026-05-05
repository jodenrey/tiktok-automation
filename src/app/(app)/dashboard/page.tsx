import Link from "next/link";
import {
  Plus,
  PlayCircle,
  PauseCircle,
  ImageIcon,
  Wand2,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { describeCron, formatNumber, formatRelative } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session?.user as { id: string }).id;

  const [automations, recentSlideshows, totals] = await Promise.all([
    prisma.automation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        schedules: true,
        _count: { select: { slideshows: true } },
        slideshows: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { post: true },
        },
      },
    }),
    prisma.slideshow.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        slides: { orderBy: { index: "asc" }, take: 1 },
        automation: { select: { title: true } },
      },
    }),
    prisma.post.aggregate({
      where: { userId, status: "published" },
      _sum: { views: true, likes: true },
      _count: true,
    }),
  ]);

  const activeCount = automations.filter((a) => a.status === "active").length;
  const stats = [
    { label: "Active automations", value: activeCount },
    { label: "Total automations", value: automations.length },
    { label: "Posts published", value: totals._count },
    {
      label: "Total views",
      value: formatNumber(totals._sum.views ?? 0),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your TikTok content automations.
          </p>
        </div>
        <Button asChild variant="primary">
          <Link href="/automations/new">
            <Plus className="h-4 w-4" />
            New automation
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-2 text-2xl font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Automations */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Your automations</h2>
        {automations.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white/5 text-muted-foreground">
                <Wand2 className="h-6 w-6" />
              </div>
              <div>
                <div className="font-medium">No automations yet</div>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                  Create your first automation to start auto-posting AI-generated TikTok slideshows.
                </p>
              </div>
              <Button asChild variant="primary" className="mt-2">
                <Link href="/automations/new">
                  <Plus className="h-4 w-4" /> Create automation
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {automations.map((a) => {
              const last = a.slideshows[0];
              return (
                <Link
                  key={a.id}
                  href={`/automations/${a.id}`}
                  className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-medium">{a.title}</h3>
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
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {a.niche ?? "Mixed niche"} · {a.numOfSlides} slides ·{" "}
                        {a._count.slideshows} generated
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    {a.schedules.slice(0, 2).map((s) => (
                      <div key={s.id} className="flex items-center gap-1.5">
                        <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground" />
                        {describeCron(s.cron)}
                      </div>
                    ))}
                    {a.schedules.length > 2 && (
                      <div className="text-xs text-muted-foreground/70">
                        +{a.schedules.length - 2} more schedules
                      </div>
                    )}
                  </div>

                  {last && (
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Last: {formatRelative(last.createdAt)}</span>
                      <Badge variant="outline" className="capitalize">
                        {last.status}
                      </Badge>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent slideshows */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent generations</h2>
          <Link href="/posts" className="text-xs text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </div>

        {recentSlideshows.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Generated slideshows will appear here.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentSlideshows.map((s) => {
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
                      {s.automation?.title && (
                        <div className="mt-0.5 text-white/60">{s.automation.title}</div>
                      )}
                    </div>
                    <div className="absolute right-2 top-2">
                      <Badge variant={s.status === "completed" ? "success" : s.status === "failed" ? "destructive" : "warning"}>
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
