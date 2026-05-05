import Link from "next/link";
import {
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  TrendingUp,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatRelative } from "@/lib/utils";

export default async function AnalyticsPage() {
  const session = await auth();
  const userId = (session?.user as { id: string }).id;

  const [agg, byAutomation, recent] = await Promise.all([
    prisma.post.aggregate({
      where: { userId, status: "published" },
      _sum: { views: true, likes: true, comments: true, shares: true, bookmarks: true },
      _count: true,
    }),
    prisma.post.groupBy({
      by: ["userId"],
      where: { userId, status: "published" },
      _sum: { views: true, likes: true },
    }),
    prisma.post.findMany({
      where: { userId, status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 20,
      include: {
        slideshow: {
          include: {
            automation: { select: { id: true, title: true } },
            slides: { orderBy: { index: "asc" }, take: 1 },
          },
        },
      },
    }),
  ]);

  const stats = [
    { label: "Posts", icon: TrendingUp, value: agg._count },
    { label: "Views", icon: Eye, value: formatNumber(agg._sum.views ?? 0) },
    { label: "Likes", icon: Heart, value: formatNumber(agg._sum.likes ?? 0) },
    { label: "Comments", icon: MessageSquare, value: formatNumber(agg._sum.comments ?? 0) },
    { label: "Shares", icon: Share2, value: formatNumber(agg._sum.shares ?? 0) },
    { label: "Saves", icon: Bookmark, value: formatNumber(agg._sum.bookmarks ?? 0) },
  ];

  void byAutomation;

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cumulative performance across all of your published posts.
        </p>
      </div>

      <div className="mt-8 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <s.icon className="h-3 w-3" /> {s.label}
              </div>
              <div className="mt-2 text-xl font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Recent posts</CardTitle>
          <CardDescription>
            Click any post to inspect its slideshow and engagement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No published posts yet — your first automation run will appear here.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recent.map((p) => {
                const cover = p.slideshow.slides[0]?.imageUrl;
                return (
                  <Link
                    key={p.id}
                    href={`/posts/${p.slideshow.id}`}
                    className="flex items-center gap-4 py-3 transition-colors hover:bg-white/[0.02] -mx-3 px-3 rounded-md"
                  >
                    <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-md bg-white/5">
                      {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-sm font-medium">
                        {p.slideshow.hook ?? "Untitled"}
                      </div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {p.slideshow.automation?.title ?? "Standalone"} ·{" "}
                        {p.publishedAt ? formatRelative(p.publishedAt) : "—"}
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {formatNumber(p.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {formatNumber(p.likes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" /> {formatNumber(p.shares)}
                      </span>
                    </div>
                    <Badge variant="success">{p.status}</Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
