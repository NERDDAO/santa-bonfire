import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { createErrorFromResponse } from "@/lib/types/errors";

/**
 * Banner response from the Delve backend.
 * This route is specific to santa-bonfire and automatically requests Christmas-themed banners.
 *
 * @see /api/hypercards/[cardId]/image - Alias endpoint that delegates to this route
 *      (treats cardId as hyperblogId for HyperCard naming convention)
 */
interface BannerResponse {
  banner_url: string;
  cached: boolean;
  hyperblog_id: string;
  enhanced?: boolean; // Indicates if Christmas enhancement was applied
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ hyperblogId: string }> }) {
  try {
    const { hyperblogId } = await params;

    if (!hyperblogId) {
      return NextResponse.json({ error: "Invalid hyperblogId" }, { status: 400 });
    }

    // Request Christmas-enhanced banners for all santa-bonfire card images
    const delveUrl = `${config.delve.apiUrl}/datarooms/hyperblogs/${hyperblogId}/banner?enhance_for_christmas=true`;

    console.log(`🎄 Requesting banner generation for hyperblog ${hyperblogId}`);

    // Extended timeout for fal.ai queue-based image generation (90 seconds)
    const delveResponse = await fetch(delveUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(90000),
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

    console.log("🎄 Christmas banner generated:", {
      hyperblog_id: hyperblogId,
      cached: bannerData.cached,
      enhanced: bannerData.enhanced,
    });

    return NextResponse.json(bannerData, { status: 200 });
  } catch (error) {
    console.error("Error in HyperBlog banner API route:", error);

    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Request timeout. Banner generation took too long." }, { status: 503 });
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
