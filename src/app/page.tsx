import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Calendar,
  ImageIcon,
  LineChart,
  Sparkles,
  Wand2,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <main className="relative">
      <BackgroundOrbs />

      {/* Nav */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo />
          <span>tiktok-automation</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild variant="primary" size="sm">
            <Link href="/signup">Start free</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-24 text-center">
        <Badge variant="outline" className="mx-auto mb-6 gap-1.5">
          <Sparkles className="h-3 w-3" /> AI slideshows that ship while you sleep
        </Badge>
        <h1 className="mx-auto max-w-3xl text-5xl md:text-6xl font-semibold tracking-tight">
          The TikTok content engine
          <br />
          that <span className="bg-gradient-to-br from-violet-400 via-fuchsia-400 to-orange-300 bg-clip-text text-transparent">runs itself.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Set up an automation once. Pick a niche, write a style prompt, plug in your TikTok — tiktok-automation generates carousels, finds images, writes captions, and publishes on schedule.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link href="/signup">
              Start automating <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">View dashboard</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required · 50 free generations
        </p>

        <HeroPreview />
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
          Everything you need to grow on TikTok
        </h2>
        <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">
          Built for creators and SaaS founders who want organic reach without becoming a full-time content team.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04]"
            >
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-300 ring-1 ring-violet-500/20">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
          From idea to published, in three steps
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Step {i + 1}</div>
              <h3 className="mt-2 text-lg font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
          Simple, predictable pricing
        </h2>
        <p className="mt-3 text-center text-muted-foreground">1 credit = 1 generated slideshow. Cancel anytime.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={
                "rounded-2xl border p-6 " +
                (p.featured
                  ? "border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-transparent shadow-lg shadow-fuchsia-500/10"
                  : "border-white/10 bg-white/[0.02]")
              }
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-medium">{p.name}</h3>
                {p.featured && <Badge variant="success">Most popular</Badge>}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold">${p.price}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.creditCount} credits per month</p>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant={p.featured ? "primary" : "outline"} className="mt-6 w-full">
                <Link href="/signup">Start with {p.name}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Stop posting. Start automating.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Connect your TikTok in two clicks. tiktok-automation handles the rest.
        </p>
        <Button asChild variant="primary" size="lg" className="mt-8">
          <Link href="/signup">
            Start your first automation <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} tiktok-automation — built with Next.js, Prisma, and Claude.
      </footer>
    </main>
  );
}

function Logo() {
  return (
    <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-lg shadow-fuchsia-500/30">
      <Sparkles className="h-3.5 w-3.5" />
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="absolute right-[-100px] top-[200px] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-3xl" />
      <div className="absolute left-1/2 top-[800px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-orange-500/5 blur-3xl" />
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2">
          {previewSlides.map((s, i) => (
            <div
              key={i}
              className="relative aspect-[4/5] overflow-hidden rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 ring-1 ring-white/10"
              style={{
                backgroundImage: `linear-gradient(to bottom right, ${s.from}, ${s.to})`,
              }}
            >
              <div className="absolute inset-0 flex items-start p-4">
                <div
                  className="text-white text-sm font-bold leading-tight"
                  style={{
                    textShadow: "0 0 6px rgba(0,0,0,0.6), 0 1px 0 rgba(0,0,0,0.6)",
                  }}
                >
                  {s.text}
                </div>
              </div>
              <div className="absolute bottom-2 right-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white/70">
                {i + 1}/4
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const previewSlides = [
  { from: "#7c3aed", to: "#db2777", text: "5 habits that changed my morning" },
  { from: "#0ea5e9", to: "#6366f1", text: "1. wake up at 5am" },
  { from: "#f59e0b", to: "#ef4444", text: "2. cold shower (just do it)" },
  { from: "#10b981", to: "#0ea5e9", text: "3. journal before phone" },
];

const features = [
  {
    icon: Bot,
    title: "Claude-powered generation",
    body:
      "Per-niche prompts produce authentic, scroll-stopping slide text. The AI never sounds like an ad.",
  },
  {
    icon: ImageIcon,
    title: "Automatic image sourcing",
    body:
      "Pull from your uploaded collections, search Pinterest/Unsplash on-the-fly, or both per slide.",
  },
  {
    icon: Calendar,
    title: "Cron-based schedules",
    body:
      "Multiple posting times per automation. PST cron syntax — or use the friendly schedule picker.",
  },
  {
    icon: Wand2,
    title: "Style prompt editor",
    body:
      "Write once: tone, slide count, font sizes, text positions, hooks. tiktok-automation respects every detail.",
  },
  {
    icon: Zap,
    title: "Direct TikTok publishing",
    body:
      "Connect your account once. Auto-publish or save as draft — captions and hashtags included.",
  },
  {
    icon: LineChart,
    title: "Native analytics",
    body:
      "Views, likes, shares, bookmarks per post. See which hooks land and double down.",
  },
];

const steps = [
  {
    title: "Connect a TikTok account",
    body:
      "OAuth into your TikTok in two clicks. tiktok-automation posts on your behalf using the Content Posting API.",
  },
  {
    title: "Create an automation",
    body:
      "Pick a niche, drop in 5-20 hook ideas, write a style prompt, and choose when you want to post.",
  },
  {
    title: "Watch it ship",
    body:
      "tiktok-automation generates fresh slideshows on your cron, never repeating the last 20 topics. You preview, it publishes.",
  },
];

const plans = [
  {
    name: "Starter",
    price: 19,
    creditCount: 50,
    featured: false,
    features: [
      "1 connected TikTok account",
      "Up to 3 active automations",
      "AI captions + hashtags",
      "Pinterest + Unsplash images",
    ],
  },
  {
    name: "Growth",
    price: 49,
    creditCount: 200,
    featured: true,
    features: [
      "5 connected TikTok accounts",
      "Unlimited automations",
      "Image collections & uploads",
      "Priority generation queue",
      "30-day analytics history",
    ],
  },
  {
    name: "Scale",
    price: 99,
    creditCount: 600,
    featured: false,
    features: [
      "Unlimited TikTok accounts",
      "Everything in Growth",
      "API access (coming soon)",
      "Webhook events",
      "Dedicated support",
    ],
  },
];
