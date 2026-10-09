import { hatchEgg } from "@/lib/pet";
import { fail, mutate, ok, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req);
  const seed = typeof body.seed === "string" ? body.seed : undefined;
  try {
    const { state, result } = await mutate((s) => {
      const r = hatchEgg(s, seed);
      s.events.unshift(...r.events);
      return r;
    });
    return ok({ state, pet: result.pet });
  } catch (e) {
    return fail((e as Error).message);
  }
}
