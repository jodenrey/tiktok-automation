// Runs a single automation: pick a hook → ask Claude → fetch images →
// persist the slideshow + post (and "publish" via the TikTok stub).

import { prisma } from "@/lib/prisma";
import { generateSlideshow } from "@/lib/claude";
import { searchImages } from "@/lib/images";
import { publishToTikTok } from "@/lib/tiktok";
import { consumeOneExportCredit, getTotalCredits } from "@/lib/credits";

export async function runAutomation(automationId: string): Promise<string> {
  const automation = await prisma.automation.findUnique({
    where: { id: automationId },
    include: {
      collection: { include: { images: true } },
      tiktokAccount: true,
      user: true,
    },
  });
  if (!automation) throw new Error(`automation ${automationId} not found`);
  if (automation.status !== "active") {
    console.log(`[run-automation] ${automationId} is not active — skipping`);
    throw new Error("automation not active");
  }

  const totalCredits = await getTotalCredits(automation.userId);
  if (totalCredits <= 0) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  const hook = pickHook(automation.hooks, await recentHooks(automationId));

  const slideshow = await prisma.slideshow.create({
    data: {
      userId: automation.userId,
      automationId: automation.id,
      hook,
      status: "generating",
    },
  });

  try {
    // 1. AI generation
    const gen = await generateSlideshow({
      hook,
      niche: automation.niche ?? undefined,
      language: automation.language,
      numOfSlides: automation.numOfSlides,
      stylePrompt: automation.stylePrompt,
      captionPrompt:
        automation.captionMode === "prompt"
          ? automation.captionPrompt
          : undefined,
    });

    // 2. Image selection
    const slides = await Promise.all(
      gen.slides.map(async (s) => {
        let imageUrl: string | null = null;

        if (automation.imageSource === "collection" && automation.collection) {
          const pool = automation.collection.images;
          if (pool.length > 0) {
            imageUrl = pool[(s.index + Math.floor(Math.random() * pool.length)) % pool.length].url;
          }
        }

        if (!imageUrl) {
          const [img] = await searchImages(s.imageQuery, 1);
          imageUrl = img?.url ?? null;
        }

        return {
          index: s.index,
          text: s.text,
          subtext: s.subtext ?? null,
          imageUrl,
          imageQuery: s.imageQuery,
          fontSize: s.index === 0 ? "extra_large" : "medium",
          style: "outline",
        };
      }),
    );

    // 3. Persist slides + caption
    await prisma.slideshow.update({
      where: { id: slideshow.id },
      data: {
        status: "completed",
        caption:
          automation.captionMode === "static"
            ? automation.captionStatic ?? gen.caption
            : gen.caption,
        hashtags: gen.hashtags,
        slides: {
          createMany: { data: slides },
        },
      },
    });

    // 4. Consume one export credit (monthly first, then purchased)
    await consumeOneExportCredit(automation.userId);

    // 5. Optionally publish to TikTok
    let post = await prisma.post.create({
      data: {
        userId: automation.userId,
        slideshowId: slideshow.id,
        status: "pending",
      },
    });

    if (automation.autoPost && automation.tiktokAccount) {
      try {
        const result = await publishToTikTok({
          tiktokAccount: automation.tiktokAccount,
          slides: slides.filter((s): s is typeof s & { imageUrl: string } => !!s.imageUrl),
          caption: gen.caption,
          hashtags: gen.hashtags,
          postMode: automation.postMode as "DIRECT_POST" | "MEDIA_UPLOAD",
          visibility: automation.visibility,
        });
        post = await prisma.post.update({
          where: { id: post.id },
          data: {
            status: "published",
            publishedAt: new Date(),
            tiktokPostId: result.postId,
          },
        });
      } catch (err) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: "failed",
            errorMessage: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }

    return slideshow.id;
  } catch (err) {
    await prisma.slideshow.update({
      where: { id: slideshow.id },
      data: {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

function pickHook(hooks: string[], recent: string[]): string {
  const fresh = hooks.filter((h) => !recent.includes(h));
  const pool = fresh.length > 0 ? fresh : hooks;
  if (pool.length === 0) return "5 things I learned this week";
  return pool[Math.floor(Math.random() * pool.length)];
}

async function recentHooks(automationId: string): Promise<string[]> {
  const recent = await prisma.slideshow.findMany({
    where: { automationId, hook: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { hook: true },
  });
  return recent.map((r) => r.hook!).filter(Boolean);
}
