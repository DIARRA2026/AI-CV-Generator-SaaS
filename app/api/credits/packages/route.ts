import { NextResponse } from "next/server";
import { WalletService } from "@/lib/credits/walletService";

export const dynamic = "force-dynamic";

/**
 * GET /api/credits/packages
 * Retourne les packs d'AI Coins actifs
 */
export async function GET() {
  try {
    const packages = await WalletService.getPackages();
    return NextResponse.json({ success: true, packages });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message }, { status: 500 });
  }
}
