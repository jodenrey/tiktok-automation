"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setLoading(true);
        const res = await signIn("credentials", {
          email: data.get("email") as string,
          password: data.get("password") as string,
          redirect: false,
        });
        setLoading(false);
        if (res?.error) {
          toast.error("Invalid email or password");
          return;
        }
        toast.success("Welcome back");
        router.push("/dashboard");
        router.refresh();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
