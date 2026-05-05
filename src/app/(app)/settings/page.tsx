import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const [user, tiktokAccounts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.tikTokAccount.findMany({ where: { userId } }),
  ]);
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account, billing, and connected accounts.
        </p>
      </div>

      <Tabs defaultValue="account" className="mt-6">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="tiktok">Connected accounts</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Name" value={user.name ?? "—"} />
              <Row label="Email" value={user.email} />
              <Row label="Plan" value={user.subscriptionTier} />
              <Row
                label="Credits"
                value={`${user.credits} monthly + ${user.purchasedCredits} purchased`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiktok">
          <Card>
            <CardHeader>
              <CardTitle>TikTok accounts</CardTitle>
              <CardDescription>
                Connect a TikTok account so automations can publish on your behalf.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tiktokAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <Badge variant="outline" className="mb-3">
                    Stub mode
                  </Badge>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Set <code>TIKTOK_CLIENT_KEY</code> +{" "}
                    <code>TIKTOK_CLIENT_SECRET</code> in <code>.env</code>, then
                    add the OAuth callback handler. Until then, automations run
                    in simulation mode (slideshows generate, but TikTok posts
                    are mocked).
                  </p>
                  <Button className="mt-4" disabled>
                    <ExternalLink className="h-4 w-4" /> Connect TikTok
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {tiktokAccounts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3"
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-semibold text-white">
                        {a.accountUsername.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          @{a.accountUsername}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {a.accountName ?? "Connected"}
                        </div>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>
                Plan management & one-time credit packs.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>Use Stripe Checkout (test mode) to buy extra export credits.</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings/billing">Open billing →</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
