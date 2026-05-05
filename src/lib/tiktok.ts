// TikTok Content Posting API integration.
//
// The Content Posting API requires a vetted developer app + per-user OAuth
// (https://developers.tiktok.com/doc/content-posting-api-overview). The flow:
//   1. /v2/post/publish/content/init/  — get an upload URL + publish_id
//   2. PUT each image binary to the upload URL
//   3. Poll /v2/post/publish/status/fetch/ until status === PUBLISH_COMPLETE
//
// Until you wire credentials in, this module simulates a publish so the rest
// of the app stays demo-able end-to-end. Replace `simulatePublish` with the
// real implementation once TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET are set.

import type { TikTokAccount } from "@prisma/client";

interface PublishInput {
  tiktokAccount: TikTokAccount;
  slides: Array<{ imageUrl: string; text: string; subtext?: string | null }>;
  caption: string;
  hashtags: string[];
  postMode: "DIRECT_POST" | "MEDIA_UPLOAD";
  visibility: string;
}

interface PublishResult {
  postId: string;
  status: "queued" | "published";
}

const HAS_TIKTOK = !!process.env.TIKTOK_CLIENT_KEY && !!process.env.TIKTOK_CLIENT_SECRET;

export async function publishToTikTok(input: PublishInput): Promise<PublishResult> {
  if (!HAS_TIKTOK || !input.tiktokAccount.accessToken) {
    return simulatePublish(input);
  }
  return realPublish(input);
}

async function simulatePublish(input: PublishInput): Promise<PublishResult> {
  await new Promise((r) => setTimeout(r, 400));
  console.log(
    `[tiktok:sim] would publish ${input.slides.length} slides to @${input.tiktokAccount.accountUsername} (mode=${input.postMode})`,
  );
  return {
    postId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: "published",
  };
}

async function realPublish(input: PublishInput): Promise<PublishResult> {
  const init = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/content/init/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.tiktokAccount.accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: input.caption.slice(0, 90),
          description: [input.caption, ...input.hashtags].join(" ").slice(0, 2000),
          privacy_level: input.visibility,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 0,
          photo_images: input.slides.map((s) => s.imageUrl),
        },
        post_mode: input.postMode,
        media_type: "PHOTO",
      }),
    },
  );

  if (!init.ok) {
    const txt = await init.text();
    throw new Error(`tiktok init failed: ${init.status} ${txt}`);
  }

  const json = (await init.json()) as {
    data?: { publish_id?: string };
    error?: { code?: string; message?: string };
  };
  const publishId = json.data?.publish_id;
  if (!publishId) {
    throw new Error(`tiktok init missing publish_id: ${JSON.stringify(json.error)}`);
  }

  return { postId: publishId, status: "queued" };
}
