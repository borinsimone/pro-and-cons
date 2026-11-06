import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const root = (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/";
  return {
    id: root,
    name: "A mente · Il tuo taccuino",
    short_name: "A mente",
    description: "Metti a fuoco i tuoi pro e contro.",
    lang: "it",
    start_url: root,
    scope: root,
    display: "standalone",
    background_color: "#f6f3ed",
    theme_color: "#f6f3ed",
    icons: [
      { src: root + "icon-192.png", sizes: "192x192", type: "image/png" },
      { src: root + "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: root + "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
