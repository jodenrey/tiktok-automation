// Image search — abstracts over Unsplash, Google CSE, and a curated fallback.
// Returns full-resolution image URLs ready to be used as slide backgrounds.

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const GOOGLE_KEY = process.env.GOOGLE_CSE_API_KEY;
const GOOGLE_CSE = process.env.GOOGLE_CSE_ID;

export interface ImageResult {
  url: string;
  width?: number;
  height?: number;
  thumbUrl?: string;
  source: "unsplash" | "google" | "fallback" | "collection";
  attribution?: string;
}

export async function searchImages(
  query: string,
  count: number = 1,
): Promise<ImageResult[]> {
  if (UNSPLASH_KEY) {
    try {
      return await searchUnsplash(query, count);
    } catch (err) {
      console.error("[unsplash] failed:", err);
    }
  }
  if (GOOGLE_KEY && GOOGLE_CSE) {
    try {
      return await searchGoogle(query, count);
    } catch (err) {
      console.error("[google-cse] failed:", err);
    }
  }
  return fallbackImages(query, count);
}

async function searchUnsplash(query: string, count: number): Promise<ImageResult[]> {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", Math.min(count * 3, 30).toString());
  url.searchParams.set("orientation", "portrait");

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY!}` },
    next: { revalidate: 60 * 60 },
  });
  if (!res.ok) throw new Error(`unsplash ${res.status}`);
  const data = (await res.json()) as {
    results: Array<{
      urls: { regular: string; small: string };
      width: number;
      height: number;
      user: { name: string; username: string };
    }>;
  };
  return data.results.slice(0, count).map((r) => ({
    url: r.urls.regular,
    thumbUrl: r.urls.small,
    width: r.width,
    height: r.height,
    source: "unsplash" as const,
    attribution: `Photo by ${r.user.name} on Unsplash`,
  }));
}

async function searchGoogle(query: string, count: number): Promise<ImageResult[]> {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", GOOGLE_KEY!);
  url.searchParams.set("cx", GOOGLE_CSE!);
  url.searchParams.set("q", query);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("num", Math.min(count, 10).toString());
  url.searchParams.set("imgSize", "large");

  const res = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!res.ok) throw new Error(`google-cse ${res.status}`);
  const data = (await res.json()) as {
    items?: Array<{ link: string; image?: { width: number; height: number; thumbnailLink: string } }>;
  };
  return (data.items ?? []).slice(0, count).map((it) => ({
    url: it.link,
    thumbUrl: it.image?.thumbnailLink,
    width: it.image?.width,
    height: it.image?.height,
    source: "google" as const,
  }));
}

// Deterministic placeholder images keyed off the query — keeps the demo
// looking real even without API keys.
function fallbackImages(query: string, count: number): ImageResult[] {
  const seed = (s: string) =>
    Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0));
  return Array.from({ length: count }, (_, i) => {
    const id = (seed(query) + i * 17) % 1000;
    return {
      url: `https://picsum.photos/seed/${encodeURIComponent(query)}-${id}/800/1000`,
      thumbUrl: `https://picsum.photos/seed/${encodeURIComponent(query)}-${id}/200/250`,
      source: "fallback" as const,
      attribution: "via picsum.photos",
    };
  });
}
