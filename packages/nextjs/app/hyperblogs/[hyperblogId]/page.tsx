import type { Metadata } from "next";
import type { HyperBlogInfo } from "@/lib/types/delve-api";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";
import HyperCardDetailClient from "./HyperCardDetailClient";

const FALLBACK_TITLE = "Santa Bonfire - AI-Generated Christmas Card";
const FALLBACK_DESCRIPTION = "Create AI-generated Christmas cards from Santa's knowledge graph";
const FALLBACK_IMAGE = "/thumbnail.jpg";
const API_TIMEOUT_MS = 10000;

// Construct base URL for internal API routes (same logic as getMetadata)
const getBaseUrl = () =>
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : `http://localhost:${process.env.PORT || 3000}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hyperblogId: string }>;
}): Promise<Metadata> {
  const { hyperblogId } = await params;

  try {
    // Fetch from internal API route to centralize backend proxying logic
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/hyperblogs/${hyperblogId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    if (!response.ok) {
      return getMetadata({
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        imageRelativePath: FALLBACK_IMAGE,
      });
    }

    const card: HyperBlogInfo = await response.json();

    const title = card.user_query || FALLBACK_TITLE;
    const description = card.summary || card.preview || FALLBACK_DESCRIPTION;

    // Handle image URL - could be absolute or relative
    let imageRelativePath = FALLBACK_IMAGE;
    if (card.banner_url) {
      if (card.banner_url.startsWith("http://") || card.banner_url.startsWith("https://")) {
        // For absolute URLs, preserve the base metadata and only override images
        const baseMetadata = getMetadata({
          title,
          description,
          imageRelativePath: FALLBACK_IMAGE,
        });
        return {
          ...baseMetadata,
          openGraph: {
            ...baseMetadata.openGraph,
            images: [{ url: card.banner_url }],
          },
          twitter: {
            ...baseMetadata.twitter,
            images: [card.banner_url],
          },
        };
      }
      imageRelativePath = card.banner_url;
    }

    return getMetadata({
      title,
      description,
      imageRelativePath,
    });
  } catch {
    return getMetadata({
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      imageRelativePath: FALLBACK_IMAGE,
    });
  }
}

export default function HyperCardDetailPage() {
  return <HyperCardDetailClient />;
}
