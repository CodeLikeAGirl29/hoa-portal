"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthCard, AUTH_BUTTON_CLASS } from "@/components/AuthCard";
import { FormMessage, INPUT_CLASS, LABEL_CLASS } from "@/components/ui/Modal";

type LinkState = "checking" | "ok" | "expired";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, setState] = useState<LinkState>(token ? "checking" : "expired");
  const [isInvite, setIsInvite] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Check the link up front, so an expired one says so before anyone
  // bothers typing a new password.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`/api/account/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok) {
          setIsInvite(data?.type === "invite");
          setState("ok");
        } else {
          setState("expired");
        }
      })
      .catch(() => {
        // A network hiccup shouldn't block the form; saving re-checks anyway.
        if (!cancelled) setState("ok");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 410) {
        setState("expired");
        return;
      }
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not save your password.");
      }
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "Could not save your password.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <AuthCard title="Password saved">
        <p className="text-sm text-gray-700 leading-relaxed mt-0 mb-5">
          You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className={`${AUTH_BUTTON_CLASS} block text-center no-underline`}
        >
          Go to sign in
        </Link>
      </AuthCard>
    );
  }

  if (state === "expired") {
    return (
      <AuthCard title="This link no longer works" backToSignIn>
        <p className="text-sm text-gray-700 leading-relaxed mt-0 mb-5">
          Password links work once and expire after a while. Request a new
          one, or ask your HOA administrator to send you another.
        </p>
        <Link
          href="/forgot-password"
          className={`${AUTH_BUTTON_CLASS} block text-center no-underline`}
        >
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  if (state === "checking") {
    return (
      <AuthCard title="Set your password">
        <p className="text-sm text-gray-600 m-0" role="status">
          Checking your link…
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={isInvite ? "Set your password" : "Choose a new password"}
      subtitle={
        isInvite
          ? "Welcome. Choose a password to finish setting up your account."
          : "Pick something you haven't used here before."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className={LABEL_CLASS}>
            New password
          </label>
          <input
            id="new-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="new-password-hint"
            className={INPUT_CLASS}
          />
          <p id="new-password-hint" className="text-xs text-gray-600 mt-1.5 m-0">
            At least 8 characters.
          </p>
        </div>

        <div>
          <label htmlFor="confirm-password" className={LABEL_CLASS}>
            Type it again
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        {error && <FormMessage>{error}</FormMessage>}

        <button type="submit" disabled={saving} className={AUTH_BUTTON_CLASS}>
          {saving ? "Saving…" : "Save password"}
        </button>
      </form>
    </AuthCard>
  );
}
