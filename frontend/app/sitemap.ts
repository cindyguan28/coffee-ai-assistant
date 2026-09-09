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
  ];
}
