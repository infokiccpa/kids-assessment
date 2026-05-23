import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KinderAssess - AI Kindergarten Readiness Assessment",
  description:
    "A fun, AI-powered kindergarten admission assessment platform! Evaluate children's readiness through playful questionnaires, video analysis, and instant comprehensive reports.",
  keywords: [
    "kindergarten",
    "readiness",
    "assessment",
    "AI",
    "admission",
    "child development",
    "education",
    "kids",
    "preschool",
  ],
  authors: [{ name: "KinderAssess Team" }],
  openGraph: {
    title: "KinderAssess - AI Kindergarten Readiness Assessment",
    description:
      "Fun and smart AI-powered admission assessment for kindergarten readiness!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
