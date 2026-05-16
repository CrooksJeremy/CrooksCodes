import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jeremycrooks.ca";
const siteName = "JeremyCrooks.ca";
const title = "JeremyCrooks.ca — Full-Stack Developer";
const description =
  "Full-stack developer building websites and web apps — fast, reliable, and built to grow with you. Based in Halifax, Nova Scotia.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s — JeremyCrooks.ca",
  },
  description,
  applicationName: siteName,
  authors: [{ name: "Jeremy Crooks", url: siteUrl }],
  creator: "Jeremy Crooks",
  publisher: "Jeremy Crooks",
  keywords: [
    "Jeremy Crooks",
    "Full-Stack Developer",
    "Next.js",
    "TypeScript",
    "React",
    "Node.js",
    "Halifax",
    "Nova Scotia",
    "Portfolio",
    "Matrix Code",
    "Dalhousie",
  ],
  category: "technology",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title,
    description,
    locale: "en_CA",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a08",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
