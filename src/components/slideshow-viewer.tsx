"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Slide {
  index: number;
  text: string;
  subtext?: string | null;
  imageUrl?: string | null;
}

export function SlideshowViewer({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const slide = slides[active];

  if (!slide) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-muted-foreground">
        No slides
      </div>
    );
  }

  return (
    <div>
      <div className="relative mx-auto w-full max-w-md">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10 bg-black">
          {slide.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.imageUrl}
              alt={slide.text}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 opacity-50" />
            </div>
          )}
          {/* Subtle dark gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-start gap-3 p-6 pt-8 text-center">
            <h2
              className={cn(
                "font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]",
                slide.index === 0 ? "text-2xl md:text-3xl" : "text-lg md:text-xl",
              )}
              style={{
                textShadow:
                  "0 0 4px rgba(0,0,0,0.7), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
              }}
            >
              {slide.text}
            </h2>
            {slide.subtext && (
              <p
                className="text-sm text-white max-w-[80%] leading-snug"
                style={{
                  textShadow:
                    "0 0 4px rgba(0,0,0,0.7), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
                }}
              >
                {slide.subtext}
              </p>
            )}
          </div>
          <div className="absolute bottom-3 right-3 rounded bg-black/40 px-2 py-1 text-xs text-white/80">
            {active + 1}/{slides.length}
          </div>
        </div>

        {/* Nav */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full"
          onClick={() => setActive((i) => Math.max(0, i - 1))}
          disabled={active === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
          onClick={() => setActive((i) => Math.min(slides.length - 1, i + 1))}
          disabled={active === slides.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Thumb strip */}
      <div className="mt-4 flex justify-center gap-1.5 overflow-x-auto pb-2">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              "relative h-16 w-12 shrink-0 overflow-hidden rounded-md border-2 transition-all",
              i === active ? "border-white" : "border-white/10 opacity-60 hover:opacity-100",
            )}
          >
            {s.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center bg-white/5 text-[10px] text-muted-foreground">
                {i + 1}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
