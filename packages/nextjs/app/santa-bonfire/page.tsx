"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HyperCardFeed } from "@/components/HyperCardFeed";
import { config } from "@/lib/config";
import type { NextPage } from "next";
import { ArrowLeftIcon, GiftIcon, SparklesIcon } from "@heroicons/react/24/outline";

/**
 * Santa Bonfire Chat Page Content
 *
 * Uses the PaidChatInterface component with the granted microsub access.
 * Provides a festive chat experience with Santa.
 */
function SantaBonfireContent() {
  const searchParams = useSearchParams();
  const microsubTxHash = searchParams.get("microsub");

  const [isValidAccess, setIsValidAccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate access on mount
  useEffect(() => {
    if (!microsubTxHash) {
      setError("No subscription provided. Please purchase a Christmas card to unlock Santa's Bonfire.");
      setIsValidAccess(false);
      return;
    }

    // Basic validation - the PaidChatInterface will handle deeper validation
    setIsValidAccess(true);
  }, [microsubTxHash]);

  // Loading state
  if (isValidAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <span className="loading loading-spinner loading-lg text-christmas-red"></span>
          <p className="text-base-content/70">Loading Santa&apos;s Workshop...</p>
        </div>
      </div>
    );
  }

  // Error state - no access
  if (error || !isValidAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card bg-base-200 max-w-lg w-full christmas-card-bg">
          <div className="card-body text-center space-y-4">
            <div className="text-6xl">🎅</div>
            <h2 className="card-title justify-center text-2xl font-serif">
              Santa&apos;s Workshop is Locked
            </h2>
            <p className="text-base-content/70">
              {error || "You need to purchase a Christmas card to chat with Santa."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link href="/data-rooms" className="btn btn-primary gap-2">
                <GiftIcon className="w-5 h-5" />
                Create a Christmas Card
              </Link>
              <Link href="/" className="btn btn-outline gap-2">
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get Santa Bonfire configuration
  const santaDataroomId = config.santaBonfire?.dataroomId;
  const santaAgentId = config.santaBonfire?.agentId;

  // Check if Santa Bonfire is configured
  if (!santaDataroomId || !santaAgentId) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="card bg-base-200 max-w-lg w-full">
          <div className="card-body text-center space-y-4">
            <div className="text-6xl">🔧</div>
            <h2 className="card-title justify-center text-2xl font-serif">
              Santa&apos;s Workshop Under Construction
            </h2>
            <p className="text-base-content/70">
              Santa&apos;s Bonfire is being set up. Please check back soon!
            </p>
            <Link href="/" className="btn btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Festive Header */}
      <div className="bg-gradient-to-r from-christmas-red/10 via-christmas-gold/10 to-christmas-green/10 border-b border-base-300">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="btn btn-ghost btn-sm btn-circle">
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold font-serif flex items-center gap-2">
                  <span className="text-3xl">🎅</span>
                  Santa&apos;s Bonfire
                  <span className="text-3xl">🎄</span>
                </h1>
                <p className="text-sm text-base-content/70">
                  Chat with Santa and contribute to the Christmas knowledge graph
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-christmas-gold animate-pulse" />
              <span className="badge badge-primary gap-1">
                ❄️ Bonus Access
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-base-200/50 border-b border-base-300">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-xl">✨</span>
            <p className="text-base-content/80">
              <span className="font-semibold">Welcome to Santa&apos;s Workshop!</span>{" "}
              Browse magical Christmas cards created by the community.
            </p>
          </div>
        </div>
      </div>

      {/* Gallery Feed */}
      <div className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        <HyperCardFeed
          dataroomId={santaDataroomId}
          displayMode="gallery"
          title="Santa's Christmas Cards"
          autoRefreshInterval={30000}
          initialLimit={12}
          className="w-full"
        />
      </div>

      {/* Festive Footer */}
      <div className="bg-gradient-to-r from-christmas-green/10 via-christmas-gold/10 to-christmas-red/10 border-t border-base-300 py-4">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-base-content/60">
            🎄 Your conversations help create better Christmas cards for everyone! 🎁
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Santa Bonfire Chat Page
 *
 * A festive chat interface for card purchasers to chat with Santa.
 * Access is granted automatically after purchasing a Christmas card.
 */
const SantaBonfirePage: NextPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <span className="loading loading-spinner loading-lg text-christmas-red"></span>
            <p className="text-base-content/70">Loading Santa&apos;s Workshop...</p>
          </div>
        </div>
      }
    >
      <SantaBonfireContent />
    </Suspense>
  );
};

export default SantaBonfirePage;




