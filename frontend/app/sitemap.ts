import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://beanmemo.com",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://beanmemo.com/privacy",
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: "https://beanmemo.com/coffee-journal",
      lastModified: "2026-09-10",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...[
      "coffee-tasting-notes",
      "brew-log",
      "discover-your-coffee-taste",
      "coffee-bean-tracker",
    ].map((path) => ({
      url: `https://beanmemo.com/${path}`,
      lastModified: "2026-09-12",
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
