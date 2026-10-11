import { NextResponse } from "next/server";
import { EGG_CATALOG, eggSrc } from "@/lib/eggs";

// AGIEgg NFT metadata points its image at /api/egg-image/<design>, where
// <design> is the egg's index in EGG_CATALOG. Redirect to the artwork.
export function GET(req: Request, { params }: { params: { design: string } }) {
  if (!/^\d+$/.test(params.design)) {
    return NextResponse.json({ error: "Unknown design" }, { status: 404 });
  }
  const egg = EGG_CATALOG[Number(params.design)];
  if (!egg) return NextResponse.json({ error: "Unknown design" }, { status: 404 });
  return NextResponse.redirect(new URL(eggSrc(egg), req.url), 308);
}
