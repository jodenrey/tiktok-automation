import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { withUser } from "@/lib/api";
import { generateSlideshow } from "@/lib/claude";
import { searchImages } from "@/lib/images";
import { consumeOneExportCredit } from "@/lib/credits";

const inputSchema = z.object({
  hook: z.string().min(1),
  niche: z.string().optional(),
  language: z.string().default("English"),
  numOfSlides: z.number().int().min(1).max(20).default(6),
  stylePrompt: z.string().min(1),
  captionPrompt: z.string().optional(),
});

// One-off slideshow generation — same shape as /v1/slideshows/generate.
// Useful for testing prompts without setting up an automation.
export async function POST(req: Request) {
  return withUser(async (userId) => {
    const json = await req.json();
    const data = inputSchema.parse(json);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.credits + user.purchasedCredits) <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits", code: "INSUFFICIENT_CREDITS" },
        { status: 402 },
      );
    }

    const slideshow = await prisma.slideshow.create({
      data: {
        userId,
        hook: data.hook,
        status: "generating",
      },
    });

    try {
      const gen = await generateSlideshow(data);

      const slides = await Promise.all(
        gen.slides.map(async (s) => {
          const [img] = await searchImages(s.imageQuery, 1);
          return {
            index: s.index,
            text: s.text,
            subtext: s.subtext ?? null,
            imageUrl: img?.url ?? null,
            imageQuery: s.imageQuery,
            fontSize: s.index === 0 ? "extra_large" : "medium",
            style: "outline",
          };
        }),
      );

      await prisma.slideshow.update({
        where: { id: slideshow.id },
        data: {
          status: "completed",
          caption: gen.caption,
          hashtags: gen.hashtags,
          slides: { createMany: { data: slides } },
        },
      });

      await consumeOneExportCredit(userId);

      return NextResponse.json({ slideshowId: slideshow.id }, { status: 201 });
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
  });
}
