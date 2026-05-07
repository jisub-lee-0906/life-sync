import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LifeSync",
    short_name: "LifeSync",
    description: "돈, 일정, 루틴, 목표를 한 번에 관리하는 개인 대시보드",
    start_url: "/finance",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0040ff",
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
