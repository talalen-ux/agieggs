import { sellAgi } from "@/lib/economics";
import { fail, mutate, ok, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req);
  const agi = Number(body.agi);
  if (!Number.isFinite(agi) || agi <= 0) return fail("Provide a positive AGI amount.");
  try {
    const { state } = await mutate((s) => {
      s.events.unshift(...sellAgi(s, agi));
    });
    return ok({ state });
  } catch (e) {
    return fail((e as Error).message);
  }
}
