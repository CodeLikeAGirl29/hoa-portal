"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const DEMO_ACCOUNTS = [
  {
    label: "Fair Oaks Admin",
    email: "admin@pelicanbayhoa.org",
    password: "admin123",
    role: "Admin",
    color: "#185FA5",
    icon: "🏖️",
  },
  {
    label: "Fair Oaks Resident",
    email: "resident@pelicanbayhoa.org",
    password: "resident123",
    role: "Resident",
    color: "#185FA5",
    icon: "🏠",
  },
  {
    label: "Palm Grove Admin",
    email: "admin@palmgrovehoa.org",
    password: "admin123",
    role: "Admin",
    color: "#2D7A4F",
    icon: "🌴",
  },
  {
    label: "Palm Grove Resident",
    email: "resident@palmgrovehoa.org",
    password: "resident123",
    role: "Resident",
    color: "#2D7A4F",
    icon: "🏡",
  },
  {
    label: "Sunset Ridge Admin",
    email: "admin@sunsetridgehoa.com",
    password: "admin123",
    role: "Admin",
    color: "#C45C1A",
    icon: "🌅",
  },
  {
    label: "Super Admin",
    email: "superadmin@floridahoaportal.com",
    password: "super123",
    role: "Super Admin",
    color: "#7C3AED",
    icon: "⚡",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(email: string, password: string) {
    setError("");
    setLoading(true);
    setShowDemo(false);
    setEmail(email);
    setPassword(password);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Demo login failed. Make sure the database is seeded.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-gray-50">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #185FA5, #0C447C)" }}
          >
            ⚓
          </div>
          <h1 className="text-xl font-bold text-gray-900 m-0">
            Florida HOA Portal
          </h1>
          <p className="text-sm text-gray-400 mt-1 m-0">
            F.S. 720.303 Compliant Document Management
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourhoa.org"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
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
            className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 cursor-pointer border-0 transition-all"
            style={{ background: "linear-gradient(135deg, #185FA5, #0C447C)" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          {/* View Demo button */}
          <button
            type="button"
            onClick={() => setShowDemo(true)}
            className="w-full py-3 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer border-0 transition-all"
          >
            🎭 View Demo
          </button>
        </form>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-[11px] text-gray-300">
            Secured · Florida Statute 720.303 Compliant · All access logged
          </p>
        </div>
      </div>

      {/* Demo modal */}
      {showDemo && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowDemo(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900 m-0">
                  Demo Accounts
                </h2>
                <p className="text-xs text-gray-400 m-0 mt-0.5">
                  Click any account to sign in instantly
                </p>
              </div>
              <button
                onClick={() => setShowDemo(false)}
                className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer border-0 bg-transparent"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  onClick={() =>
                    handleDemoLogin(account.email, account.password)
                  }
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:shadow-sm disabled:opacity-50 cursor-pointer bg-white text-left transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${account.color}15` }}
                  >
                    {account.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800">
                      {account.label}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {account.email}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: `${account.color}15`,
                      color: account.color,
                    }}
                  >
                    {account.role}
                  </span>
                </button>
              ))}
            </div>

            <div className="px-6 pb-5 text-center">
              <p className="text-[11px] text-gray-300">
                Demo data only · Not for production use
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
