"use client";

import { useState } from "react";
import { AuthCard, AUTH_BUTTON_CLASS } from "@/components/AuthCard";
import { FormMessage, INPUT_CLASS, LABEL_CLASS } from "@/components/ui/Modal";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/account/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Could not send the link. Try again.");
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? "Could not send the link. Try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <AuthCard title="Check your email" backToSignIn>
        <p className="text-sm text-gray-700 leading-relaxed m-0">
          If <strong>{email}</strong> belongs to an account, a link to choose
          a new password is on its way. It works once and expires in an hour.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mt-4 mb-0">
          Nothing after a few minutes? Check your spam folder, or ask your HOA
          administrator to send you a link.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send a link to choose a new one."
      backToSignIn
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className={LABEL_CLASS}>
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourhoa.org"
            className={INPUT_CLASS}
          />
        </div>

        {error && <FormMessage>{error}</FormMessage>}

        <button type="submit" disabled={sending} className={AUTH_BUTTON_CLASS}>
          {sending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthCard>
  );
}
