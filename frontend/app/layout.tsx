import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";
import "./globals.css";
import "./cof74-taste-layers.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const serif = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://beanmemo.com"),
  title: {
    default: "Beanmemo — Personal Coffee Journal & Taste Tracker",
    template: "%s | Beanmemo",
  },
  description:
    "Keep a personal coffee journal, remember every bean and brew, and discover the coffees you truly enjoy.",
  applicationName: "Beanmemo",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Beanmemo",
    title: "Beanmemo — Your personal coffee journal",
    description: "Remember every bean. Learn from every brew. Discover what you love.",
  },
  twitter: {
    card: "summary",
    title: "Beanmemo — Your personal coffee journal",
    description: "Remember every bean. Learn from every brew. Discover what you love.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://beanmemo.com/#organization",
        name: "Beanmemo",
        url: "https://beanmemo.com/",
      },
      {
        "@type": "WebSite",
        "@id": "https://beanmemo.com/#website",
        url: "https://beanmemo.com/",
        name: "Beanmemo",
        description: "A private personal coffee journal for your beans, brews, and evolving taste.",
        publisher: { "@id": "https://beanmemo.com/#organization" },
        inLanguage: "en",
      },
    ],
  };

  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
