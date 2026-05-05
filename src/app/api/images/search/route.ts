import { NextResponse } from "next/server";
import { withUser } from "@/lib/api";
import { searchImages } from "@/lib/images";

export async function GET(req: Request) {
  return withUser(async () => {
    const url = new URL(req.url);
    const query = url.searchParams.get("q");
    const count = Math.min(Number(url.searchParams.get("count") ?? "8"), 20);
    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 422 });
    }
    const images = await searchImages(query, count);
    return { images };
  });
}
