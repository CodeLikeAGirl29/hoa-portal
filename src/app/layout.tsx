import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Florida HOA Portal",
    template: "%s | Florida HOA Portal",
  },
  description:
    "Florida Statute 720.303 compliant HOA document management portal serving communities statewide.",
  keywords: [
    "HOA",
    "Florida",
    "homeowners association",
    "documents",
    "720.303",
  ],
  authors: [{ name: "Florida HOA Portal" }],
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "https://myflhoa.org"),
  openGraph: {
    type: "website",
    siteName: "Florida HOA Portal",
    title: "Florida HOA Portal",
    description:
      "F.S. 720.303 compliant document management for Florida HOA communities.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
