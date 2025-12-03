"use client";

import Link from "next/link";
import { ArrowRightIcon, ClockIcon, CurrencyDollarIcon, FolderIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-16 space-y-6">
        <h1 className="text-5xl font-bold font-serif tracking-tight text-base-content">🎄 How Santa Bonfire Works</h1>
        <p className="text-xl text-base-content/70 max-w-3xl mx-auto leading-relaxed">
          Transform Santa&apos;s knowledge graph into magical, AI-generated Christmas cards in four simple steps.
          Blockchain-verified payments ensure secure access to holiday magic.
        </p>
      </div>

      {/* Steps Overview */}
      <div className="bg-base-200/50 p-8 sm:p-12 rounded-2xl mb-16 border border-base-content/5 christmas-card-bg">
        <div className="steps steps-vertical lg:steps-horizontal w-full">
          <div className="step step-primary text-sm font-medium">🔥 Explore Bonfires</div>
          <div className="step step-primary text-sm font-medium">💳 Connect & Create</div>
          <div className="step step-primary text-sm font-medium">✨ Magic Happens</div>
          <div className="step step-primary text-sm font-medium">🎁 Share Joy</div>
        </div>
      </div>

      {/* Detailed Steps */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold font-serif text-center mb-12">The Magic Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Step 1 */}
          <div className="card-minimal bg-base-100 p-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-christmas-red/10 rounded-full flex items-center justify-center shrink-0">
                <FolderIcon className="h-7 w-7 text-christmas-red" />
              </div>
              <div className="space-y-3">
                <div className="badge badge-primary badge-outline">Step 1</div>
                <h3 className="text-xl font-bold font-serif">🔥 Explore Bonfires</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Browse Santa&apos;s magical bonfires, each containing curated knowledge graphs about holiday themes,
                  Christmas traditions, and heartfelt messages. View pricing and content previews before creating your card.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card-minimal bg-base-100 p-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-christmas-green/20 rounded-full flex items-center justify-center shrink-0">
                <CurrencyDollarIcon className="h-7 w-7 text-christmas-green" />
              </div>
              <div className="space-y-3">
                <div className="badge badge-secondary badge-outline">Step 2</div>
                <h3 className="text-xl font-bold font-serif">💳 Connect & Create</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Connect your wallet and make a secure payment using the x402 protocol. All transactions are verified
                  on-chain, ensuring transparent and trustless access to Santa&apos;s workshop.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card-minimal bg-base-100 p-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-christmas-gold/10 rounded-full flex items-center justify-center shrink-0">
                <SparklesIcon className="h-7 w-7 text-christmas-gold" />
              </div>
              <div className="space-y-3">
                <div className="badge badge-accent badge-outline">Step 3</div>
                <h3 className="text-xl font-bold font-serif">✨ Magic Happens</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Our AI elves use Hierarchical Task Networks to traverse Santa&apos;s knowledge graph and craft
                  personalized Christmas cards. Creation typically takes 30-60 seconds of pure holiday magic.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="card-minimal bg-base-100 p-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-info/10 rounded-full flex items-center justify-center shrink-0">
                <ClockIcon className="h-7 w-7 text-info" />
              </div>
              <div className="space-y-3">
                <div className="badge badge-info badge-outline">Step 4</div>
                <h3 className="text-xl font-bold font-serif">🎁 Share Joy</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Once your Christmas card is ready, share it with friends and family. Make it public to spread holiday
                  cheer in Santa&apos;s gallery, or keep it as a special private message.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="bg-base-200/30 p-8 sm:p-12 rounded-2xl mb-16 border border-base-content/5">
        <h2 className="text-3xl font-bold font-serif text-center mb-8">🛠️ Powered By Holiday Magic</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4">
            <div className="font-semibold text-christmas-red mb-2">HTN Generation</div>
            <p className="text-sm text-base-content/60">Hierarchical Task Networks for structured card content</p>
          </div>
          <div className="text-center p-4">
            <div className="font-semibold text-christmas-green mb-2">Knowledge Graphs</div>
            <p className="text-sm text-base-content/60">Graphiti-powered graph traversal</p>
          </div>
          <div className="text-center p-4">
            <div className="font-semibold text-christmas-gold mb-2">x402 Protocol</div>
            <p className="text-sm text-base-content/60">Blockchain payment verification</p>
          </div>
          <div className="text-center p-4">
            <div className="font-semibold text-primary mb-2">RainbowKit</div>
            <p className="text-sm text-base-content/60">Seamless wallet connection</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center space-y-6">
        <h2 className="text-4xl font-bold font-serif">🎄 Ready to Create Your Card?</h2>
        <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
          Explore Santa&apos;s bonfires and create your first magical Christmas card today.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link href="/data-rooms" className="btn btn-primary btn-lg px-10 transition-all duration-300 gap-2">
            🔥 Explore Bonfires
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
          <Link href="/" className="btn btn-ghost btn-lg transition-all duration-300">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

