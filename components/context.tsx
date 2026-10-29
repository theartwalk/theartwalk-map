"use client";
import { createContext, useContext } from "react";
import type { AppData, Show } from "@/lib/types";
import type { Lang, T } from "@/lib/i18n";
import type { Personal } from "@/lib/store";
import type { StatusKind, WalkPlan } from "@/lib/status";

export type Ctx = {
  data: AppData;
  t: T;
  lang: Lang;
  now: Date;
  byId: Map<string, Show>;
  walks: WalkPlan[];
  personal: Personal;
  st: (s: Show) => { kind: StatusKind; text: string };
  dist: (s: Show) => number;
  distLabel: (s: Show) => string;
  toggleSave: (id: string) => void;
  toggleVisited: (id: string) => void;
  openDetail: (s: Show, from: HTMLElement | null) => void;
  startWalk: (id: string) => void;
  toast: (msg: string) => void;
};
export const AppCtx = createContext<Ctx | null>(null);
export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppCtx");
  return c;
}
