import React, { useEffect } from "react";

interface WhatIsHyperCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatIsHyperCardsModal = ({ isOpen, onClose }: WhatIsHyperCardsModalProps) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal modal-open backdrop-blur-sm" onClick={onClose}>
      <div
        className="modal-box bg-base-100 max-w-2xl relative p-6 sm:p-10 md:p-12 shadow-2xl christmas-modal"
        onClick={e => e.stopPropagation()}
      >
        <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 sm:right-4 sm:top-4" onClick={onClose}>
          ✕
        </button>

        <h2 className="text-3xl font-bold mb-8 px-2 sm:px-0 font-serif text-base-content">🎄 What Are Christmas Cards?</h2>

        <div className="space-y-6 px-2 sm:px-4 text-base-content/80 leading-loose text-lg">
          <p>
            🎁 Christmas Cards are AI-generated personalized holiday greetings created from Santa&apos;s Bonfire knowledge graphs. 
            Using advanced Hierarchical Task Network (HTN) generation, we transform Santa&apos;s wisdom into unique, heartfelt 
            messages that bring joy and warmth to your loved ones.
          </p>
          <p>
            💳 Each Christmas Card is payment-gated using the x402 protocol with blockchain verification. When you purchase a 
            card, your payment is recorded on-chain, ensuring transparent and secure transactions. This also grants you access 
            to Santa&apos;s Bonfire where you can contribute to future holiday magic.
          </p>
          <p>
            ✨ Card creation happens in the background and takes 30-60 seconds, allowing our AI to carefully craft each section 
            with personalized, context-aware holiday messages. Track the magic in real-time and get notified when your card is 
            ready to share!
          </p>
        </div>

        <div className="modal-action mt-10 px-2 sm:px-0">
          <button
            className="btn btn-primary px-8 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={onClose}
          >
            🎁 Let&apos;s Create!
          </button>
        </div>
      </div>
    </div>
  );
};

