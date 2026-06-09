"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const isDev = process.env.NODE_ENV === "development";

const DEMO_ACCOUNTS = [
  {
    label: "Pelican Bay Admin",
    email: "admin@pelicanbayhoa.org",
    password: "admin123",
  },
  {
    label: "Pelican Bay Resident",
    email: "resident@pelicanbayhoa.org",
    password: "resident123",
  },
  {
    label: "Palm Grove Admin",
    email: "admin@palmgrovehoa.org",
    password: "admin123",
  },
  {
    label: "Super Admin",
    email: "superadmin@floridahoaportal.com",
    password: "super123",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[0]) {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header band */}
          <div
            className="px-8 py-7 text-white"
            style={{ background: "linear-gradient(135deg, #185FA5, #0C447C)" }}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">⚓</span>
              <div>
                <h1 className="text-xl font-bold tracking-tight m-0">
                  Florida HOA Portal
                </h1>
                <p className="text-white/70 text-xs mt-0.5 m-0">
                  F.S. 720.303 Compliant Document Management
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              Sign in to your HOA
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Your account is linked to your community automatically.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@yourhoa.org"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-150 disabled:opacity-60 cursor-pointer border-0"
                style={{
                  background: "linear-gradient(135deg, #185FA5, #0C447C)",
                }}
              >
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </form>

            {/* Demo accounts — only shown in development */}
            {isDev && (
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wide">
                  🔧 Dev — Demo accounts
                </p>
                <div className="space-y-1.5">
                  {DEMO_ACCOUNTS.map((a) => (
                    <button
                      key={a.email}
                      type="button"
                      onClick={() => fillDemo(a)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-white border border-amber-100 hover:border-amber-300 transition-all cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-gray-700">
                        {a.label}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {a.email}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Florida HOA Portal · Serving communities statewide
        </p>
      </div>
    </div>
  );
}
