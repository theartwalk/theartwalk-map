"use client";
import dynamic from "next/dynamic";
import type { AppData } from "@/lib/types";

// The map app needs the browser (canvas, WebGL, local storage), so it renders on the client only.
// Individual show pages under /shows/[id] are server-rendered for search engines and link previews.
const App = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => <div className="app" aria-busy="true" />
});

export default function ClientApp({ data }: { data: AppData }) {
  return <App data={data} />;
}
