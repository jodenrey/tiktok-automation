import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-3xl" />
      </div>
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-lg shadow-fuchsia-500/30">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          ReelFarm
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
