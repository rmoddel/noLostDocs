import type { MetadataRoute } from "next";
import { brand } from "@/constants/brand";

const routes = ["", "/login", "/dashboard", "/scan", "/security", "/privacy", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${brand.siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  }));
}
