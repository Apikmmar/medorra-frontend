import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Medorra — AI Symptom Diary",
    short_name: "Medorra",
    description:
      "Track symptoms, medications, food, and sleep. Get AI-powered insights into your health patterns.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#080b0f",
    theme_color: "#080b0f",
    categories: ["health", "medical", "lifestyle"],
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      {
        src: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
  };
}
