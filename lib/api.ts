import { NextResponse } from "next/server";
import { loadState, saveState } from "./storage";
import { reconcileDegradation } from "./economics";
import type { GameEvent, GameState } from "./types";

// Wraps a mutator: load state, run passive reconciliation (degradation band
// check), run the user mutation, persist, and return the public state.
export async function mutate<T = unknown>(
  fn: (state: GameState) => Promise<T> | T,
): Promise<{ state: GameState; result: T }> {
  const state = await loadState();
  const auto: GameEvent[] = [];
  auto.push(...reconcileDegradation(state));
  const result = await fn(state);
  state.events.unshift(...auto);
  trimEvents(state);
  await saveState(state);
  return { state, result };
}

export async function readState(): Promise<GameState> {
  const state = await loadState();
  const auto: GameEvent[] = [];
  auto.push(...reconcileDegradation(state));
  if (auto.length) {
    state.events.unshift(...auto);
    trimEvents(state);
    await saveState(state);
  }
  return state;
}

function trimEvents(state: GameState) {
  if (state.events.length > 100) state.events = state.events.slice(0, 100);
}

export function ok(data: object) {
  return NextResponse.json({ ok: true, ...data });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
