import { trainPet } from "@/lib/pet";
import { fail, mutate, ok, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req);
  const petId = String(body.petId ?? "");
  if (!petId) return fail("petId required");
  try {
    const { state } = await mutate((s) => {
      s.events.unshift(...trainPet(s, petId));
    });
    return ok({ state });
  } catch (e) {
    return fail((e as Error).message);
  }
}
