"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Dictionary, Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({
  locale,
  copy,
  mode,
  nextPath,
}: {
  locale: Locale;
  copy: Dictionary;
  mode: "login" | "register";
  nextPath: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const auth = copy.auth;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!res.ok) {
      const code = data.error ?? "INTERNAL";
      setError(auth.errors[code as keyof typeof auth.errors] ?? auth.errors.INTERNAL);
      return;
    }
    router.push(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{auth.email}</Label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{auth.password}</Label>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? auth.pending : mode === "login" ? auth.submitLogin : auth.submitRegister}
      </Button>
      <p className="text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            {auth.noAccount}{" "}
            <Link className="text-foreground underline-offset-4 hover:underline" href={`/${locale}/register?next=${encodeURIComponent(nextPath)}`}>
              {auth.submitRegister}
            </Link>
          </>
        ) : (
          <>
            {auth.hasAccount}{" "}
            <Link className="text-foreground underline-offset-4 hover:underline" href={`/${locale}/login?next=${encodeURIComponent(nextPath)}`}>
              {auth.submitLogin}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
