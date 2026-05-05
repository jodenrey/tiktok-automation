import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SlideshowViewer } from "@/components/slideshow-viewer";
import { PublishButton } from "@/components/publish-button";
import { formatNumber, formatRelative } from "@/lib/utils";

export default async function PostPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id: string }).id;

  const slideshow = await prisma.slideshow.findFirst({
    where: { id, userId },
    include: {
      slides: { orderBy: { index: "asc" } },
      automation: true,
      post: true,
    },
  });
  if (!slideshow) notFound();

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link
          href={
            slideshow.automationId
              ? `/automations/${slideshow.automationId}`
              : "/dashboard"
          }
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {slideshow.hook ?? "Untitled slideshow"}
            </h1>
            <Badge
              variant={
                slideshow.status === "completed"
                  ? "success"
                  : slideshow.status === "failed"
                    ? "destructive"
                    : "warning"
              }
            >
              {slideshow.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {slideshow.automation?.title ?? "Standalone"} ·{" "}
            {slideshow.slides.length} slides · created{" "}
            {formatRelative(slideshow.createdAt)}
          </p>
        </div>
        {slideshow.post?.status !== "published" && slideshow.status === "completed" && (
          <PublishButton slideshowId={slideshow.id} />
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Slideshow viewer */}
        <SlideshowViewer
          slides={slideshow.slides.map((s) => ({
            index: s.index,
            text: s.text,
            subtext: s.subtext,
            imageUrl: s.imageUrl,
          }))}
        />

        {/* Sidebar */}
        <aside className="space-y-4">
          {slideshow.post && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Performance</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                <Stat icon={Eye} label="Views" value={slideshow.post.views} />
                <Stat icon={Heart} label="Likes" value={slideshow.post.likes} />
                <Stat icon={MessageSquare} label="Comments" value={slideshow.post.comments} />
                <Stat icon={Share2} label="Shares" value={slideshow.post.shares} />
                <Stat icon={Bookmark} label="Saves" value={slideshow.post.bookmarks} />
                <div className="rounded-lg border border-white/10 p-3">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="mt-1 capitalize">{slideshow.post.status}</div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Caption</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {slideshow.caption ?? <span className="text-muted-foreground">—</span>}
              </p>
              {slideshow.hashtags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {slideshow.hashtags.map((h) => (
                    <span
                      key={h}
                      className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {slideshow.errorMessage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-red-300">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs whitespace-pre-wrap text-red-200/80 font-mono">
                  {slideshow.errorMessage}
                </p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{formatNumber(value)}</div>
    </div>
  );
}
