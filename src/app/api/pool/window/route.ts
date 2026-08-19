import {
  getPoolWindow,
  isPickWindowOpen,
  isRevealWindowOpen,
} from "@/lib/pool-week";
import { NextResponse } from "next/server";

export async function GET() {
  const window = getPoolWindow();
  return NextResponse.json({
    ...window,
    pickOpen: isPickWindowOpen(),
    revealOpen: isRevealWindowOpen(),
  });
}
