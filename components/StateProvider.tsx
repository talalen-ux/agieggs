"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { GameState } from "@/lib/types";

type Ctx = {
  state: GameState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  call: (
    path: string,
    body?: Record<string, unknown>,
  ) => Promise<{ ok: boolean; error?: string; state?: GameState; reply?: string }>;
};

const StateCtx = createContext<Ctx | null>(null);

export function useGame() {
  const c = useContext(StateCtx);
  if (!c) throw new Error("useGame outside provider");
  return c;
}

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setState(json.state);
        setError(null);
      } else {
        setError(json.error ?? "failed to load");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const call = useCallback(
    async (path: string, body: Record<string, unknown> = {}) => {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.state) setState(json.state);
      if (!json.ok) setError(json.error ?? "request failed");
      return json;
    },
    [],
  );

  useEffect(() => {
    refresh();
    // poll for accrual / degradation while idle
    const i = setInterval(refresh, 30_000);
    return () => clearInterval(i);
  }, [refresh]);

  const value = useMemo(
    () => ({ state, loading, error, refresh, call }),
    [state, loading, error, refresh, call],
  );

  return <StateCtx.Provider value={value}>{children}</StateCtx.Provider>;
}
