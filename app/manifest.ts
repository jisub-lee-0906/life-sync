import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LifeSync",
    short_name: "LifeSync",
    description: "Private all-in-one dashboard for money, plans, routines, and goals.",
    start_url: "/finance",
    display: "standalone",
    background_color: "#f6efe4",
    theme_color: "#f6efe4",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
