import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Art Walk",
    short_name: "Art Walk",
    description: "Delhi's exhibitions, gallery walks and openings on one map.",
    start_url: "/",
    display: "standalone",
    background_color: "#F2F2EF",
    theme_color: "#F2F2EF",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }]
  };
}
