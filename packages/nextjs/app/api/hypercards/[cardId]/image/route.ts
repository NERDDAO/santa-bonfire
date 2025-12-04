import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { createErrorFromResponse } from "@/lib/types/errors";

/**
 * Banner response from the Delve backend.
 * This route delegates to the hyperblog banner endpoint, treating cardId as hyperblogId.
 *
 * This endpoint provides an alias for /api/hyperblogs/[hyperblogId]/banner
 * to support the HyperCard naming convention while maintaining backward compatibility.
 *
 * @see /api/hyperblogs/[hyperblogId]/banner for the canonical endpoint
 */
interface BannerResponse {
  banner_url: string;
  cached: boolean;
  hyperblog_id: string;
  enhanced?: boolean; // Indicates if Christmas enhancement was applied
}

/**
 * POST /api/hypercards/[cardId]/image
 *
 * Generates or retrieves a banner image for the HyperCard (Christmas card).
 * This is an alias for /api/hyperblogs/[hyperblogId]/banner that treats
 * cardId as the underlying hyperblogId.
 *
 * All santa-bonfire requests automatically include Christmas enhancement.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params;

    if (!cardId) {
      return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
    }

    // Delegate to the Delve backend using cardId as hyperblogId
    // Request Christmas-enhanced banners for all santa-bonfire card images
    const delveUrl = `${config.delve.apiUrl}/datarooms/hyperblogs/${cardId}/banner?enhance_for_christmas=true`;

    // Longer timeout for image generation (30 seconds)
    const delveResponse = await fetch(delveUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!delveResponse.ok) {
      const error = await createErrorFromResponse(delveResponse);
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
        },
        { status: error.statusCode },
      );
    }

    const bannerData: BannerResponse = await delveResponse.json();

    console.log("🎄 Christmas card image generated:", {
      card_id: cardId,
      cached: bannerData.cached,
      enhanced: bannerData.enhanced,
    });

    return NextResponse.json(bannerData, { status: 200 });
  } catch (error) {
    console.error("Error in HyperCard image API route:", error);

    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timeout. Image generation took too long." }, { status: 503 });
    }

    if (error instanceof Error && error.message.includes("fetch")) {
      return NextResponse.json(
        { error: "Failed to connect to Delve backend. Please check the backend is running." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}


