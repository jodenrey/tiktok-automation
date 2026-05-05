"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublishButton({ slideshowId }: { slideshowId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="primary"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const res = await fetch(`/api/slideshows/${slideshowId}/publish`, {
          method: "POST",
        });
        setPending(false);
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          return toast.error(json.error ?? "Could not publish");
        }
        toast.success("Publish queued");
        router.refresh();
      }}
    >
      <Send className="h-4 w-4" /> Publish to TikTok
    </Button>
  );
}
