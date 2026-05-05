import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

export const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

export const HAS_ANTHROPIC = !!apiKey;

// ---------------------------------------------------------------
// Slideshow generation
// ---------------------------------------------------------------

export interface SlideContent {
  index: number;
  imageQuery: string; // search query to find a background image
  text: string; // headline text on the slide
  subtext?: string; // optional supporting text
}

export interface GeneratedSlideshow {
  hook: string;
  slides: SlideContent[];
  caption: string;
  hashtags: string[];
}

export interface GenerateInput {
  hook: string; // e.g. "5 habits that changed my morning routine"
  niche?: string;
  language?: string;
  numOfSlides: number;
  stylePrompt: string; // user-defined style/format/tone instructions
  captionPrompt?: string; // separate prompt for caption + hashtags
}

const SYSTEM_PROMPT = `You are tiktok-automation's slideshow content engine. You write authentic, emotional, first-person TikTok carousel content that hooks viewers within the first slide.

Rules:
- NEVER mention any brand or product name in slide text.
- Use short, punchy sentences. Sound like a real person, not an ad.
- Slide 1 is the hook — it must stop the scroll.
- Each slide stands on its own but pulls the viewer to the next one.
- Image queries should describe a single, photographable scene (4-8 words, no people's names, no copyrighted characters).

Always respond with a single JSON object — no commentary, no markdown fences. Schema:

{
  "hook": "string — the headline / topic of the slideshow",
  "slides": [
    { "index": 0, "imageQuery": "...", "text": "...", "subtext": "..." }
  ],
  "caption": "string — TikTok caption, 1-3 sentences, casual",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}

The slides array length must exactly match the requested slide count.`;

export async function generateSlideshow(
  input: GenerateInput,
): Promise<GeneratedSlideshow> {
  if (!anthropic) {
    return mockSlideshow(input);
  }

  const userPrompt = `Hook / topic: ${input.hook}
Niche: ${input.niche ?? "general"}
Language: ${input.language ?? "English"}
Number of slides: ${input.numOfSlides} (must be exactly this many)

Style + format instructions from the user:
"""
${input.stylePrompt}
"""

Caption guidance (write the caption following this):
"""
${input.captionPrompt ?? "Casual, hooky, 1-2 sentences. End with 5-8 relevant hashtags."}
"""

Return JSON now.`;

  const res = await anthropic.messages.create({
    model,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = parseJsonLoose(text);
  return validate(parsed, input.numOfSlides);
}

function parseJsonLoose(text: string): unknown {
  // Strip markdown fences if Claude included them
  const cleaned = text
    .replace(/^```(?:json)?/m, "")
    .replace(/```$/m, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Last-ditch: extract first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude returned non-JSON output");
    return JSON.parse(match[0]);
  }
}

function validate(raw: unknown, expectedSlides: number): GeneratedSlideshow {
  if (!raw || typeof raw !== "object") throw new Error("Invalid output");
  const obj = raw as Record<string, unknown>;
  const hook = String(obj.hook ?? "");
  const caption = String(obj.caption ?? "");
  const hashtags = Array.isArray(obj.hashtags)
    ? obj.hashtags.map(String).filter(Boolean)
    : [];
  const slidesRaw = Array.isArray(obj.slides) ? obj.slides : [];
  const slides: SlideContent[] = slidesRaw.slice(0, expectedSlides).map(
    (s, i): SlideContent => {
      const slide = s as Record<string, unknown>;
      return {
        index: typeof slide.index === "number" ? slide.index : i,
        imageQuery: String(slide.imageQuery ?? slide.image_query ?? hook),
        text: String(slide.text ?? ""),
        subtext: slide.subtext ? String(slide.subtext) : undefined,
      };
    },
  );
  while (slides.length < expectedSlides) {
    slides.push({
      index: slides.length,
      imageQuery: hook,
      text: "",
    });
  }
  return { hook, slides, caption, hashtags };
}

// ---------------------------------------------------------------
// Mock generator — used when ANTHROPIC_API_KEY is not configured,
// so the rest of the app stays demo-able end-to-end.
// ---------------------------------------------------------------
function mockSlideshow(input: GenerateInput): GeneratedSlideshow {
  const slides: SlideContent[] = Array.from({ length: input.numOfSlides }, (_, i) => {
    if (i === 0) {
      return {
        index: 0,
        imageQuery: `aesthetic ${input.niche ?? "lifestyle"} background`,
        text: input.hook,
      };
    }
    return {
      index: i,
      imageQuery: `${input.niche ?? "aesthetic"} moment ${i}`,
      text: `${i}. tip ${i}`,
      subtext:
        "this is a demo slide because no ANTHROPIC_API_KEY is set — add one to get real AI-generated content",
    };
  });

  return {
    hook: input.hook,
    slides,
    caption: `${input.hook} — what would you add?`,
    hashtags: ["#fyp", "#viral", "#tiktok", `#${(input.niche ?? "lifestyle").replace(/\s+/g, "")}`],
  };
}
