import { promises as fs } from "fs";
import path from "path";
import type { GameState } from "./types";
import { seedState } from "./seed";

// On Vercel/serverless the project dir is read-only; only /tmp is writable
// and only ephemeral. We pick the best available dir and silently fall back
// to memory-only mode if neither works (so the demo still runs).
const DATA_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? "/tmp/agi-pets"
    : path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");

let cache: GameState | null = null;
let writeQueue: Promise<void> = Promise.resolve();
let writesDisabled = false;

export async function loadState(): Promise<GameState> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    cache = JSON.parse(raw) as GameState;
  } catch {
    cache = seedState();
    await persist(cache);
  }
  return cache;
}

export async function saveState(next: GameState): Promise<void> {
  cache = next;
  if (writesDisabled) return;
  // Serialize writes so concurrent API calls don't clobber the file.
  writeQueue = writeQueue.then(() => persist(next)).catch(() => {});
  await writeQueue;
}

export function clearCache() {
  cache = null;
}

async function persist(state: GameState) {
  if (writesDisabled) return;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (e) {
    // Read-only FS or quota — keep going from in-memory cache. The demo
    // still works for the lifetime of this serverless instance.
    writesDisabled = true;
    if (process.env.NODE_ENV !== "production") {
      console.warn("[storage] persistence disabled:", (e as Error).message);
    }
  }
}
