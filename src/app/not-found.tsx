// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">⚓</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-xl text-gray-500 mb-2">Page not found</p>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or you don't have permission
          to view it.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white no-underline"
            style={{ background: "linear-gradient(135deg, #185FA5, #0C447C)" }}
          >
            Go Home
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 no-underline transition-all"
          >
            Sign In
          </Link>
        </div>
        <p className="text-xs text-gray-300 mt-8">
          Florida HOA Portal · F.S. 720.303 Compliant
        </p>
      </div>
    </div>
  );
}
