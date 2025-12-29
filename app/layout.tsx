import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import SessionProvider from "@/components/SessionProvider";

// Use system fonts when Google Fonts are not available in build environment

export const metadata: Metadata = {
  title: "ResumeIQ - AI-Powered Resume Analysis & Optimization | Land Your Dream Job",
  description: "Transform your resume with ResumeIQ's AI-powered intelligence. Get personalized insights, role-specific guidance, and data-driven recommendations in just 6 minutes. Trusted by thousands of professionals. Free analysis, no credit card required.",
  keywords: [
    "resume analysis",
    "AI resume builder",
    "resume optimization",
    "career tools",
    "resume scoring",
    "job application",
    "resume feedback",
    "professional resume",
    "resume improvement",
    "career development"
  ],
  authors: [{ name: "ResumeIQ" }],
  creator: "ResumeIQ",
  publisher: "ResumeIQ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://resumeiq.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ResumeIQ - AI-Powered Resume Analysis & Optimization",
    description: "Get personalized resume insights and data-driven recommendations in 6 minutes. Free analysis, no credit card required.",
    url: "https://resumeiq.com",
    siteName: "ResumeIQ",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ResumeIQ - AI Resume Intelligence",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeIQ - AI-Powered Resume Analysis",
    description: "Transform your resume with intelligent AI insights. Free analysis in 6 minutes.",
    images: ["/twitter-image.png"],
    creator: "@resumeiq",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionProvider>
          <AuthProvider>
            <Navbar />
            <main className="pt-24 md:pt-28">{children}</main>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
