import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/reset-password", "/space/"],
    },
    sitemap: "https://beanmemo.com/sitemap.xml",
    host: "https://beanmemo.com",
  };
}
