import { Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CollectionsPage() {
  const session = await auth();
  const userId = (session?.user as { id: string }).id;

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { images: true } }, images: { take: 4 } },
  });

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated image sets for use as slideshow backgrounds.
          </p>
        </div>
        <Button variant="primary" disabled>
          <Plus className="h-4 w-4" /> New collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="p-12 text-center">
            <Badge variant="outline" className="mb-3">
              Coming soon
            </Badge>
            <h3 className="font-medium">Image collections</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              Upload your own image library and reference it from any automation.
              Storage backends (Supabase, S3) are wired in <code>src/lib</code>{" "}
              — the upload UI ships next.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-1">
                  {c.images.map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.url}
                      alt=""
                      className="aspect-square w-full rounded-md object-cover"
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="font-medium">{c.name}</div>
                  <span className="text-xs text-muted-foreground">
                    {c._count.images} images
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
