import { hatchEgg } from "@/lib/pet";
import { fail, mutate, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { state, result } = await mutate((s) => {
      const r = hatchEgg(s);
      s.events.unshift(...r.events);
      return r;
    });
    return ok({ state, pet: result.pet });
  } catch (e) {
    return fail((e as Error).message);
  }
}
