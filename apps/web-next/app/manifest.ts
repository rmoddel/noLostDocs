import type { MetadataRoute } from "next";
import { assetPaths } from "@/constants/assets";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NoLostDocs",
    short_name: "NoLostDocs",
    description:
      "Securely store, organize, and find your important documents — license, insurance, registration, medical cards, and more — all in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1ea",
    theme_color: "#231d1b",
    icons: [
      {
        src: assetPaths.icons.android192,
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: assetPaths.icons.android512,
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: assetPaths.icons.maskable512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
