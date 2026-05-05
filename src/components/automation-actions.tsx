"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  automationId: string;
  status: "active" | "paused" | "out_of_credits";
}

export function AutomationActions({ automationId, status }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const callPatch = async (action: "pause" | "unpause") => {
    setPending(true);
    const res = await fetch(`/api/automations/${automationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPending(false);
    if (!res.ok) return toast.error("Could not update automation");
    toast.success(action === "pause" ? "Paused" : "Resumed");
    router.refresh();
  };

  const runNow = async () => {
    const startedAt = new Date();
    setPending(true);

    const loadingId = toast.loading("Starting generation… (0s)");
    const ticker = window.setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      toast.loading(`Generating slideshow… (${seconds}s)`, { id: loadingId });
    }, 500);

    try {
      const res = await fetch(`/api/automations/${automationId}/run`, {
        method: "POST",
      });
      if (res.status === 402) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(
          json.error ?? "Insufficient credits — buy packs in Billing",
          { id: loadingId },
        );
        return;
      }
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(json.error ?? "Could not trigger run", { id: loadingId });
        return;
      }

      // Poll for the newest slideshow created after we triggered the run.
      const deadlineMs = Date.now() + 90_000;
      let lastStatus: string | null = null;
      while (Date.now() < deadlineMs) {
        const latestRes = await fetch(
          `/api/automations/${automationId}/latest?createdAfter=${encodeURIComponent(
            startedAt.toISOString(),
          )}`,
          { cache: "no-store" },
        );
        if (latestRes.ok) {
          const json = (await latestRes.json()) as {
            slideshow: { id: string; status: string; errorMessage: string | null } | null;
          };
          const ss = json.slideshow;
          if (ss) {
            if (ss.status !== lastStatus) {
              lastStatus = ss.status;
              toast.loading(`Status: ${ss.status}…`, { id: loadingId });
            }
            if (ss.status === "completed") {
              toast.success("Slideshow ready — opening preview", { id: loadingId });
              router.push(`/posts/${ss.id}`);
              router.refresh();
              return;
            }
            if (ss.status === "failed") {
              toast.error(ss.errorMessage ?? "Generation failed", { id: loadingId });
              router.refresh();
              return;
            }
          }
        }
        await new Promise((r) => setTimeout(r, 1500));
      }

      toast.message("Still generating — refresh in a moment.", { id: loadingId });
      router.refresh();
    } finally {
      window.clearInterval(ticker);
      setPending(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this automation? This cannot be undone.")) return;
    setPending(true);
    const res = await fetch(`/api/automations/${automationId}`, {
      method: "DELETE",
    });
    setPending(false);
    if (!res.ok) return toast.error("Could not delete automation");
    toast.success("Deleted");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="primary" onClick={runNow} disabled={pending}>
        <Sparkles className="h-4 w-4" /> Run now
      </Button>

      {status === "active" ? (
        <Button variant="outline" onClick={() => callPatch("pause")} disabled={pending}>
          <PauseCircle className="h-4 w-4" /> Pause
        </Button>
      ) : (
        <Button variant="outline" onClick={() => callPatch("unpause")} disabled={pending}>
          <PlayCircle className="h-4 w-4" /> Resume
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/automations/${automationId}/edit`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-300 focus:text-red-300"
            onClick={remove}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
