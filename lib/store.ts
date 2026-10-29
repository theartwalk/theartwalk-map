"use client";
import { useCallback, useEffect, useState } from "react";
import type { Lang } from "./i18n";

/** Everything a visitor keeps lives on their device. No account is needed. */
export type Personal = { saved: Record<string, number>; visited: Record<string, number>; name: string };
export type Theme = "system" | "light" | "dark";
const KEY = "taw-v1";
const EMPTY: Personal = { saved: {}, visited: {}, name: "" };

function read<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: keep in memory */ } }

export function usePersonal() {
  const [p, setP] = useState<Personal>(EMPTY);
  useEffect(() => { setP({ ...EMPTY, ...read(KEY, EMPTY) }); }, []);
  const update = useCallback((fn: (p: Personal) => Personal) => setP(prev => { const next = fn(prev); write(KEY, next); return next; }), []);
  return [p, update] as const;
}

export function usePref<T extends string>(key: string, fallback: T) {
  const [v, setV] = useState<T>(fallback);
  useEffect(() => { setV(read<T>(key, fallback)); }, [key, fallback]);
  const set = useCallback((next: T) => { setV(next); write(key, next); }, [key]);
  return [v, set] as const;
}
export const useLang = () => usePref<Lang>("taw-lang", "en");
export const useTheme = () => usePref<Theme>("taw-theme", "system");
