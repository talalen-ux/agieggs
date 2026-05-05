import { buyAgi } from "@/lib/economics";
import { fail, mutate, ok, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req);
  const usd = Number(body.usd);
  if (!Number.isFinite(usd) || usd <= 0) return fail("Provide a positive USD amount.");
  if (usd > 100_000) return fail("MVP cap: $100,000 per buy.");
  try {
    const { state } = await mutate((s) => {
      s.events.unshift(...buyAgi(s, usd));
    });
    return ok({ state });
  } catch (e) {
    return fail((e as Error).message);
  }
}
