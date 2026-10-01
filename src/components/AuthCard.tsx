import type { ReactNode } from "react";
import Link from "next/link";

/**
 * The centred card used by the sign-in, forgot-password and set-password
 * pages, so the three look like one flow.
 */
export function AuthCard({
  title,
  subtitle,
  children,
  backToSignIn = false,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  backToSignIn?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full max-w-md overflow-hidden">
        <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-gray-200">
          <Link
            href="/"
            className="text-sm font-semibold text-hoa-blue no-underline hover:underline"
          >
            Florida HOA Portal
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-3 mb-0 font-serif">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1.5 mb-0">{subtitle}</p>
          )}
        </div>

        <div className="px-6 sm:px-8 py-6">{children}</div>

        {backToSignIn && (
          <div className="px-6 sm:px-8 pb-6">
            <Link
              href="/login"
              className="text-sm font-medium text-hoa-blue underline underline-offset-2"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export const AUTH_BUTTON_CLASS =
  "w-full py-3 rounded-lg text-sm font-semibold text-white bg-hoa-blue hover:bg-hoa-navy disabled:opacity-60 cursor-pointer border-0 transition-colors";
