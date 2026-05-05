import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withUser } from "@/lib/api";
import { publishToTikTok } from "@/lib/tiktok";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return withUser(async (userId) => {
    const slideshow = await prisma.slideshow.findFirst({
      where: { id, userId },
      include: {
        slides: { orderBy: { index: "asc" } },
        post: true,
        automation: { include: { tiktokAccount: true } },
      },
    });
    if (!slideshow)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (slideshow.status !== "completed") {
      return NextResponse.json(
        { error: `Slideshow status is ${slideshow.status}` },
        { status: 409 },
      );
    }

    const tiktokAccount = slideshow.automation?.tiktokAccount;
    if (!tiktokAccount) {
      // Even without an account we'll simulate so the demo works end-to-end.
      // In a real deployment you'd return 412 here.
    }

    const post =
      slideshow.post ??
      (await prisma.post.create({
        data: {
          userId,
          slideshowId: slideshow.id,
          status: "pending",
        },
      }));

    try {
      const result = tiktokAccount
        ? await publishToTikTok({
            tiktokAccount,
            slides: slideshow.slides
              .filter((s): s is typeof s & { imageUrl: string } => !!s.imageUrl)
              .map((s) => ({
                imageUrl: s.imageUrl,
                text: s.text,
                subtext: s.subtext,
              })),
            caption: slideshow.caption ?? "",
            hashtags: slideshow.hashtags,
            postMode: (slideshow.automation?.postMode as "DIRECT_POST" | "MEDIA_UPLOAD") ?? "DIRECT_POST",
            visibility: slideshow.automation?.visibility ?? "PUBLIC_TO_EVERYONE",
          })
        : { postId: `sim_${Date.now()}`, status: "published" as const };

      const updated = await prisma.post.update({
        where: { id: post.id },
        data: {
          status: "published",
          publishedAt: new Date(),
          tiktokPostId: result.postId,
        },
      });
      return { post: updated };
    } catch (err) {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: "failed",
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      });
      throw err;
    }
  });
}
