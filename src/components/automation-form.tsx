"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface Props {
  collections: { id: string; name: string }[];
  tiktokAccounts: { id: string; accountUsername: string }[];
  initial?: AutomationFormValues & { id: string };
}

export interface AutomationFormValues {
  title: string;
  niche: string;
  language: string;
  numOfSlides: number;
  hooks: string[];
  stylePrompt: string;
  imageSource: "pinterest" | "unsplash" | "collection";
  collectionId: string | null;
  tiktokAccountId: string | null;
  autoPost: boolean;
  postMode: "DIRECT_POST" | "MEDIA_UPLOAD";
  visibility: string;
  captionMode: "prompt" | "static";
  captionPrompt: string;
  captionStatic: string;
  schedules: { cron: string }[];
}

const DEFAULT_STYLE = `I want EXACTLY 6 slides about the topic in the hook.
The first slide is the hook in EXTRA LARGE font, all lowercase.
Slides 2-6 each cover one numbered point: 3 text items per slide
(a numbered heading 5-7 words + 2 supporting lines ~10 words each), all in SMALL font, 70% width, outline text style, top 1/3rd of the slide.
Conversational first-person voice, 7th-grade reading level, ALL TEXT LOWERCASE.`;

const DEFAULT_VALUES: AutomationFormValues = {
  title: "",
  niche: "",
  language: "English",
  numOfSlides: 6,
  hooks: [
    "5 habits that changed my morning",
    "things i wish i knew sooner",
  ],
  stylePrompt: DEFAULT_STYLE,
  imageSource: "pinterest",
  collectionId: null,
  tiktokAccountId: null,
  autoPost: true,
  postMode: "DIRECT_POST",
  visibility: "PUBLIC_TO_EVERYONE",
  captionMode: "prompt",
  captionPrompt: "Write a casual, hooky 1-2 sentence TikTok caption that mirrors the slide topic.",
  captionStatic: "",
  schedules: [{ cron: "0 9 * * *" }],
};

export function AutomationForm({ collections, tiktokAccounts, initial }: Props) {
  const router = useRouter();
  const [v, setV] = useState<AutomationFormValues>(initial ?? DEFAULT_VALUES);
  const [saving, setSaving] = useState(false);
  const [hookDraft, setHookDraft] = useState("");

  const update = <K extends keyof AutomationFormValues>(
    key: K,
    value: AutomationFormValues[K],
  ) => setV((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!v.title.trim()) return toast.error("Give your automation a title");
        if (v.hooks.length === 0)
          return toast.error("Add at least one hook idea");
        if (v.schedules.length === 0)
          return toast.error("Add at least one posting schedule");

        setSaving(true);
        const url = initial
          ? `/api/automations/${initial.id}`
          : "/api/automations";
        const res = await fetch(url, {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(v),
        });
        setSaving(false);
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          return toast.error(json.error ?? "Could not save automation");
        }
        const data = (await res.json()) as { automation: { id: string } };
        toast.success(initial ? "Automation updated" : "Automation created");
        router.push(`/automations/${data.automation.id}`);
        router.refresh();
      }}
    >
      {/* Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Basics</CardTitle>
          <CardDescription>Give your automation a name and niche.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input
              placeholder="e.g. Morning routine carousel"
              value={v.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Niche / topic</Label>
            <Input
              placeholder="fitness, finance, beauty…"
              value={v.niche}
              onChange={(e) => update("niche", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <Input
              value={v.language}
              onChange={(e) => update("language", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Slides per post</Label>
            <Input
              type="number"
              min={3}
              max={12}
              value={v.numOfSlides}
              onChange={(e) =>
                update("numOfSlides", Math.max(1, Number(e.target.value) || 6))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-fuchsia-300" />
            Prompt configuration
          </CardTitle>
          <CardDescription>
            Tell Claude how to format every slide — tone, font sizes, text positions, voice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Style prompt</Label>
            <Textarea
              rows={10}
              value={v.stylePrompt}
              onChange={(e) => update("stylePrompt", e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Tip: be explicit about font sizes (small/medium/large), text positions
              (top/center/bottom), word counts per slide, and voice.
            </p>
          </div>

          <Separator />

          {/* Hooks */}
          <div className="space-y-2">
            <Label>Slideshow hooks</Label>
            <p className="text-xs text-muted-foreground">
              The AI rotates through these topics. Each run generates fresh content
              and never repeats the last 20 hooks.
            </p>
            <div className="flex flex-wrap gap-2">
              {v.hooks.map((h, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer gap-1.5 px-2.5 py-1.5"
                  onClick={() =>
                    update(
                      "hooks",
                      v.hooks.filter((_, idx) => idx !== i),
                    )
                  }
                >
                  {h}
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a hook idea, then press Enter"
                value={hookDraft}
                onChange={(e) => setHookDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (hookDraft.trim()) {
                      update("hooks", [...v.hooks, hookDraft.trim()]);
                      setHookDraft("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (hookDraft.trim()) {
                    update("hooks", [...v.hooks, hookDraft.trim()]);
                    setHookDraft("");
                  }
                }}
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image source */}
      <Card>
        <CardHeader>
          <CardTitle>Image source</CardTitle>
          <CardDescription>
            Where tiktok-automation should get the slide background images.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Source</Label>
            <Select
              value={v.imageSource}
              onValueChange={(value: "pinterest" | "unsplash" | "collection") =>
                update("imageSource", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pinterest">Pinterest (auto search)</SelectItem>
                <SelectItem value="unsplash">Unsplash (auto search)</SelectItem>
                <SelectItem value="collection">My image collection</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {v.imageSource === "collection" && (
            <div className="space-y-2">
              <Label>Collection</Label>
              {collections.length === 0 ? (
                <div className="text-xs text-muted-foreground rounded-md border border-dashed border-white/10 px-3 py-2">
                  No collections yet —{" "}
                  <a className="underline" href="/collections">
                    create one
                  </a>
                  .
                </div>
              ) : (
                <Select
                  value={v.collectionId ?? ""}
                  onValueChange={(value) => update("collectionId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {collections.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>
            Cron expressions in PST. e.g. <code>0 9 * * *</code> = every day at 9 AM PST.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {v.schedules.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="0 9 * * *"
                value={s.cron}
                onChange={(e) => {
                  const next = [...v.schedules];
                  next[i] = { cron: e.target.value };
                  update("schedules", next);
                }}
                className="font-mono"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  update(
                    "schedules",
                    v.schedules.filter((_, idx) => idx !== i),
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => update("schedules", [...v.schedules, { cron: "0 17 * * *" }])}
          >
            <Plus className="h-4 w-4" /> Add posting time
          </Button>
        </CardContent>
      </Card>

      {/* TikTok */}
      <Card>
        <CardHeader>
          <CardTitle>TikTok publishing</CardTitle>
          <CardDescription>
            Connect your TikTok in Settings to enable auto-posting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>TikTok account</Label>
              {tiktokAccounts.length === 0 ? (
                <div className="text-xs text-muted-foreground rounded-md border border-dashed border-white/10 px-3 py-2">
                  No accounts connected — auto-post will run in simulation mode.
                </div>
              ) : (
                <Select
                  value={v.tiktokAccountId ?? ""}
                  onValueChange={(value) => update("tiktokAccountId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiktokAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        @{a.accountUsername}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Post mode</Label>
              <Select
                value={v.postMode}
                onValueChange={(value: "DIRECT_POST" | "MEDIA_UPLOAD") =>
                  update("postMode", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT_POST">Direct publish</SelectItem>
                  <SelectItem value="MEDIA_UPLOAD">Save as TikTok draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/10 p-3">
            <div>
              <div className="text-sm font-medium">Auto-publish to TikTok</div>
              <div className="text-xs text-muted-foreground">
                Off = generate slideshows but only save drafts in tiktok-automation.
              </div>
            </div>
            <Switch
              checked={v.autoPost}
              onCheckedChange={(checked) => update("autoPost", checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Caption</Label>
            <Select
              value={v.captionMode}
              onValueChange={(value: "prompt" | "static") => update("captionMode", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prompt">AI-generated from a prompt</SelectItem>
                <SelectItem value="static">Same text every time</SelectItem>
              </SelectContent>
            </Select>
            {v.captionMode === "prompt" ? (
              <Textarea
                rows={3}
                value={v.captionPrompt}
                onChange={(e) => update("captionPrompt", e.target.value)}
                className="font-mono text-xs"
              />
            ) : (
              <Textarea
                rows={3}
                value={v.captionStatic}
                onChange={(e) => update("captionStatic", e.target.value)}
                placeholder="My static caption + #hashtags"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Saving…" : initial ? "Save changes" : "Create automation"}
        </Button>
      </div>
    </form>
  );
}
