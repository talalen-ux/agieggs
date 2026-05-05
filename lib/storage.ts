import { promises as fs } from "fs";
import path from "path";
import type { GameState } from "./types";
import { seedState } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");

let cache: GameState | null = null;
let writeQueue: Promise<void> = Promise.resolve();

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
  // Serialize writes so concurrent API calls don't clobber the file.
  writeQueue = writeQueue.then(() => persist(next)).catch(() => {});
  await writeQueue;
}

export function clearCache() {
  cache = null;
}

async function persist(state: GameState) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}
