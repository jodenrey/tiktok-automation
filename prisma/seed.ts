import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@reelfarm.dev";
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo User",
      passwordHash,
      credits: 100,
      subscriptionTier: "Growth",
    },
  });

  // Connected TikTok account (simulated)
  const tiktok = await prisma.tikTokAccount.upsert({
    where: { userId_accountUsername: { userId: user.id, accountUsername: "demo_creator" } },
    update: {},
    create: {
      userId: user.id,
      accountUsername: "demo_creator",
      accountName: "Demo Creator",
    },
  });

  // Sample automation
  const existing = await prisma.automation.findFirst({
    where: { userId: user.id, title: "Morning routine ideas" },
  });
  if (!existing) {
    await prisma.automation.create({
      data: {
        userId: user.id,
        title: "Morning routine ideas",
        niche: "lifestyle",
        language: "English",
        numOfSlides: 6,
        hooks: [
          "5 habits that changed my morning",
          "things i wish i started doing earlier",
          "my no-phone morning routine",
        ],
        stylePrompt:
          "I want EXACTLY 6 slides. First slide is the hook in EXTRA LARGE font, all lowercase. Slides 2-6 each cover one numbered point: 3 text items per slide (heading 5-7 words + 2 lines ~10 words each), SMALL font, 70% width, outline style, top 1/3rd. Conversational first-person voice, 7th-grade reading level, all lowercase.",
        imageSource: "pinterest",
        tiktokAccountId: tiktok.id,
        autoPost: true,
        captionMode: "prompt",
        captionPrompt:
          "Write a 1-2 sentence casual TikTok caption that mirrors the slide topic. End with 5-8 relevant hashtags.",
        schedules: { create: [{ cron: "0 9 * * *" }, { cron: "0 17 * * *" }] },
      },
    });
  }

  console.log(`Seeded user: ${email}`);
  console.log("Password: password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
