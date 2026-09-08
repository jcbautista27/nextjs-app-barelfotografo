import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "El Fotógrafo — Pedidos y ventas",
    short_name: "El Fotógrafo",
    description:
      "Sistema de pedidos y control de ventas — El Fotógrafo, Pisco Puro de Ica · Desde 1991",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6f0",
    theme_color: "#a8630f",
    lang: "es",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}