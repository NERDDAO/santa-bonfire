"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HyperCardCreator } from "@/components/HyperCardCreator";
import { HyperCardFeed } from "@/components/HyperCardFeed";
import { WhatIsHyperCardsModal } from "@/components/WhatIsHyperCardsModal";
import { config } from "@/lib/config";
import type { NextPage } from "next";
import { ClockIcon, CurrencyDollarIcon, SparklesIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [dataroomDetails, setDataroomDetails] = useState<{ description?: string; price?: number }>({});
  const router = useRouter();

  const handleMakeCard = useCallback(async () => {
    setIsCreatorOpen(true);
    try {
      const response = await fetch(`/api/datarooms/${config.defaultDataroom}`);
      if (response.ok) {
        const data = await response.json();
        setDataroomDetails({
          description: data.description,
          price: data.current_hyperblog_price_usd ? parseFloat(data.current_hyperblog_price_usd) : data.price_usd,
        });
      }
    } catch (err) {
      console.error("Failed to fetch dataroom details:", err);
    }
  }, []);

  const handleCardSuccess = useCallback(
    (hypercardId: string) => {
      setIsCreatorOpen(false);
      router.push(`/hypercards/${hypercardId}`);
    },
    [router],
  );

  useEffect(() => {
    const hasSeenInfo = localStorage.getItem("hasSeenSantaBonfireInfo");
    if (!hasSeenInfo) {
      setIsInfoModalOpen(true);
      localStorage.setItem("hasSeenSantaBonfireInfo", "true");
    }
  }, []);

  return (
    <>
      <div className="flex items-center flex-col grow pt-10 min-h-screen">
        <div className="px-5 max-w-4xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-section animate-fade-in">
            <div>
              <span className="block text-2xl mb-4 text-base-content/60 font-medium tracking-wide">🎄 Welcome to</span>
              <h1 className="flex items-center justify-center gap-4 text-5xl sm:text-6xl lg:text-7xl font-bold font-serif tracking-tight mb-6 text-base-content">
                <Image
                  src="/logo.svg"
                  alt="Santa Bonfire Logo"
                  width={80}
                  height={40}
                  className="h-12 sm:h-14 lg:h-16 w-auto"
                />
                <span className="text-base-content/30">|</span>
                Santa Bonfire
              </h1>
              <p className="block text-xl mt-4 text-base-content/70 leading-relaxed max-w-2xl mx-auto">
                Transform Santa&apos;s knowledge graph into magical, AI-generated Christmas cards with blockchain-verified payments ❄️
              </p>
            </div>

            <div className="flex flex-col justify-center items-center gap-3">
              <button className="btn btn-primary btn-lg transition-all duration-300 px-8" onClick={handleMakeCard}>
                🎁 Make a Card Now
              </button>
              <button
                className="btn btn-ghost btn-sm text-base-content/60 hover:text-christmas-red hover:bg-transparent"
                onClick={() => setIsInfoModalOpen(true)}
              >
                What are Christmas Cards?
              </button>
            </div>
          </div>

          {/* Latest Cards Section */}
          <div className="max-w-6xl mx-auto mb-20 w-full space-y-8">
            <div className="p-1 bg-transparent">
              <HyperCardFeed showFilters={true} title="" autoRefreshInterval={60000} initialLimit={6} displayMode="gallery" />
            </div>

            <div className="text-center mt-12">
              <Link href="/data-rooms" className="btn btn-primary btn-lg transition-all duration-300 px-8">
                🎅 Explore Santa&apos;s Workshop →
              </Link>
            </div>
          </div>

          {/* Learn How It Works CTA */}
          <div className="bg-base-200/50 p-8 sm:p-10 rounded-2xl mb-20 w-full border border-base-content/5 text-center christmas-card-bg">
            <h2 className="text-2xl font-bold mb-3 font-serif">🎄 New to Santa Bonfire?</h2>
            <p className="text-base-content/70 mb-6">
              Learn how Santa&apos;s knowledge graph transforms into magical, AI-generated Christmas cards with blockchain payments.
            </p>
            <Link href="/how-it-works" className="btn btn-outline btn-primary transition-all duration-300">
              Learn How It Works →
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grow bg-base-200/30 w-full mt-12 px-6 py-20 border-t border-base-content/5">
          <div className="flex justify-center gap-8 flex-col md:flex-row max-w-6xl mx-auto">
            <div className="card-minimal flex-1 bg-base-100 animate-slide-up">
              <div className="items-center text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-christmas-red/10 rounded-full flex items-center justify-center mb-4">
                  <SparklesIcon className="h-8 w-8 text-christmas-red" />
                </div>
                <h3 className="text-xl font-bold font-serif">✨ Magical Card Creation</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Advanced AI generates unique, heartfelt Christmas cards from Santa&apos;s knowledge graph using hierarchical task networks.
                </p>
                <div className="badge badge-outline badge-primary mt-2">Unique & Personal</div>
              </div>
            </div>

            <div className="card-minimal flex-1 bg-base-100 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <div className="items-center text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-christmas-green/20 rounded-full flex items-center justify-center mb-4">
                  <CurrencyDollarIcon className="h-8 w-8 text-christmas-green" />
                </div>
                <h3 className="text-xl font-bold font-serif">💳 Payment-Gated Access</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Secure x402 protocol payments unlock access to Santa&apos;s Bonfire with blockchain verification and on-chain transaction tracking.
                </p>
                <div className="badge badge-outline badge-secondary mt-2">Verified On-Chain</div>
              </div>
            </div>

            <div className="card-minimal flex-1 bg-base-100 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <div className="items-center text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-christmas-gold/10 rounded-full flex items-center justify-center mb-4">
                  <ClockIcon className="h-8 w-8 text-christmas-gold" />
                </div>
                <h3 className="text-xl font-bold font-serif">⚡ Instant Magic</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Card creation happens in the background. Track the magic in real-time with instant notifications when your card is ready.
                </p>
                <div className="badge badge-outline badge-accent mt-2">30-60 seconds</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-4xl mx-auto mt-24 mb-12 text-center space-y-6">
            <h2 className="text-4xl font-bold font-serif">🎁 Ready to Create Your Card?</h2>
            <p className="text-xl text-base-content/70 mb-8">
              Explore Santa&apos;s bonfires and create your first magical Christmas card
            </p>
            <Link href="/data-rooms" className="btn btn-primary btn-lg px-10 transition-all duration-300">
              🎄 Create Christmas Card
            </Link>
          </div>

          {/* Tech Stack */}
          <div className="max-w-3xl mx-auto mt-20">
            <div className="collapse collapse-plus bg-base-100 border border-base-content/5 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
              <input type="checkbox" />
              <div className="collapse-title text-xl font-medium font-serif px-8 py-6">🛠️ Technology Stack</div>
              <div className="collapse-content px-8 pb-8">
                <ul className="space-y-4 text-base-content/80 leading-relaxed">
                  <li className="flex gap-3">
                    <span className="font-semibold text-christmas-red min-w-[140px]">HTN Generation:</span>
                    <span>Hierarchical Task Network for structured card creation</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-christmas-red min-w-[140px]">Knowledge Graphs:</span>
                    <span>Graphiti-powered knowledge graph traversal and content extraction</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-christmas-red min-w-[140px]">OnchainFi:</span>
                    <span>Payment verification and settlement via x402 protocol</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-christmas-red min-w-[140px]">Async Processing:</span>
                    <span>Background task processing with status polling</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-christmas-red min-w-[140px]">RainbowKit + wagmi:</span>
                    <span>Wallet connection and transaction signing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WhatIsHyperCardsModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />

      <HyperCardCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        dataroomId={config.defaultDataroom}
        dataroomDescription={dataroomDetails.description}
        dataroomPrice={dataroomDetails.price}
        onSuccess={handleCardSuccess}
      />
    </>
  );
};

export default Home;

