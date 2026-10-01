"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthCard, AUTH_BUTTON_CLASS } from "@/components/AuthCard";
import {
  FormMessage,
  INPUT_CLASS,
  LABEL_CLASS,
  Modal,
} from "@/components/ui/Modal";

const DEMO_ACCOUNTS = [
  {
    label: "Fair Oaks admin",
    email: "admin@fairoakshoa.org",
    password: "admin123",
    role: "Admin",
    color: "#185FA5",
  },
  {
    label: "Fair Oaks resident",
    email: "resident@fairoakshoa.org",
    password: "resident123",
    role: "Resident",
    color: "#185FA5",
  },
  {
    label: "Palm Grove admin",
    email: "admin@palmgrovehoa.org",
    password: "admin123",
    role: "Admin",
    color: "#2D7A4F",
  },
  {
    label: "Palm Grove resident",
    email: "resident@palmgrovehoa.org",
    password: "resident123",
    role: "Resident",
    color: "#2D7A4F",
  },
  {
    label: "Sunset Ridge admin",
    email: "admin@sunsetridgehoa.com",
    password: "admin123",
    role: "Admin",
    color: "#C45C1A",
  },
  {
    label: "Super admin",
    email: "superadmin@floridahoaportal.com",
    password: "super123",
    role: "All communities",
    color: "#7C3AED",
  },
];

// `authorize` in src/lib/auth.ts throws these when the database is the problem.
function describeLoginError(code: string, isDemo: boolean): string {
  if (code === "DatabaseNotMigrated") {
    return "The database hasn't been set up yet. Run `npx prisma migrate deploy`, then `npm run db:seed`.";
  }
  if (code === "DatabaseUnavailable") {
    return "Can't reach the database right now. Try again in a moment.";
  }
  return isDemo
    ? "This demo account doesn't exist yet. Run `npm run db:seed` to create the demo data."
    : "That email and password don't match an account.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function attempt(emailValue: string, passwordValue: string, isDemo: boolean) {
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: emailValue,
        password: passwordValue,
        redirect: false,
      });
      if (result?.error) {
        setError(describeLoginError(result.error, isDemo));
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Sign-in didn't go through. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    attempt(email, password, false);
  }

  function handleDemoLogin(account: (typeof DEMO_ACCOUNTS)[number]) {
    setShowDemo(false);
    setEmail(account.email);
    setPassword(account.password);
    attempt(account.email, account.password, true);
  }

  return (
    <>
      <AuthCard
        title="Sign in"
        subtitle="Open your community's records, minutes and notices."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className={LABEL_CLASS}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourhoa.org"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="login-password" className={LABEL_CLASS}>
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-hoa-blue underline underline-offset-2"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          {error && <FormMessage>{error}</FormMessage>}

          <button type="submit" disabled={loading} className={AUTH_BUTTON_CLASS}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => setShowDemo(true)}
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold text-hoa-blue bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-60"
          >
            Try a demo account
          </button>
        </form>

        <p className="text-xs text-gray-600 mt-6 mb-0">
          Not a resident?{" "}
          <Link href="/" className="text-hoa-blue underline underline-offset-2">
            Browse public records
          </Link>
          . Signed-in access to documents is logged.
        </p>
      </AuthCard>

      {showDemo && (
        <Modal
          title="Demo accounts"
          description="Pick one to sign in. This is sample data, not a real community."
          onClose={() => setShowDemo(false)}
          size="sm"
        >
          <ul className="list-none m-0 p-4 space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  onClick={() => handleDemoLogin(account)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 cursor-pointer bg-white text-left transition-colors"
                >
                  <span
                    aria-hidden="true"
                    className="w-2.5 h-10 rounded-full flex-shrink-0"
                    style={{ background: account.color }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">
                      {account.label}
                    </span>
                    <span className="block text-xs text-gray-600 truncate">
                      {account.email}
                    </span>
                  </span>
                  <span className="text-xs font-medium text-gray-700 flex-shrink-0">
                    {account.role}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </>
  );
}
