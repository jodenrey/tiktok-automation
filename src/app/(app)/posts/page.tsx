import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";

export default async function PostsPage() {
  const session = await auth();
  const userId = (session?.user as { id: string }).id;

  const slideshows = await prisma.slideshow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      slides: { orderBy: { index: "asc" }, take: 1 },
      automation: { select: { title: true } },
      post: true,
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every slideshow you&apos;ve generated, manual or automated.
      </p>

      {slideshows.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            No posts yet — your generations will land here.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {slideshows.map((s) => {
            const cover = s.slides[0]?.imageUrl;
            return (
              <Link
                key={s.id}
                href={`/posts/${s.id}`}
                className="group block overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-colors hover:bg-white/[0.04]"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/40">
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt=""
                      className="h-full w-full object-cover opacity-90 transition-transform group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-xs text-white">
                    <div className="line-clamp-2 font-medium">{s.hook ?? "Untitled"}</div>
                    <div className="mt-0.5 text-white/60">
                      {s.automation?.title ?? "Standalone"} · {formatRelative(s.createdAt)}
                    </div>
                  </div>
                  <div className="absolute right-2 top-2 flex flex-col gap-1 items-end">
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
                    {s.post?.status === "published" && (
                      <Badge variant="default">Published</Badge>
                    )}
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
