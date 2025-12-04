"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HyperCardProgressModal } from "@/components/HyperCardProgressModal";
import { usePaymentHeader } from "@/hooks/usePaymentHeader";
import {
  HyperBlogHTNProgress,
  HyperBlogInfo,
  PurchaseHyperBlogRequest,
  PurchaseHyperBlogResponse,
} from "@/lib/types/delve-api";
import { formatErrorMessage } from "@/lib/utils";
import { notification } from "@/utils/scaffold-eth/notification";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

interface HyperCardCreatorProps {
  dataroomId: string;
  dataroomDescription?: string;
  dataroomPrice?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (hypercardId: string) => void;
}

export const HyperCardCreator: React.FC<HyperCardCreatorProps> = ({
  dataroomId,
  dataroomDescription,
  dataroomPrice,
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Form state
  const [userQuery, setUserQuery] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Loading/Error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [hypercardId, setHypercardId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<"idle" | "generating" | "completed" | "failed">("idle");
  const [wordCount, setWordCount] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // HTN Progress state
  const [htnProgress, setHtnProgress] = useState<HyperBlogHTNProgress | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hooks
  const { isConnected, address } = useAccount();
  const { buildAndSignPaymentHeader, isLoading: isSigningPayment } = usePaymentHeader();

  // Effect: Reset state on modal close
  useEffect(() => {
    if (!isOpen) {
      setUserQuery("");
      setIsPublic(true);
      setIsLoading(false);
      setError(null);
      setHypercardId(null);
      setGenerationStatus("idle");
      setWordCount(null);
      setPreview(null);
      setHtnProgress(null);
      setShowProgressModal(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [isOpen]);

  // Effect: Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Effect: Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current && isConnected) {
      textareaRef.current.focus();
    }
  }, [isOpen, isConnected]);

  // Validation helper
  const isQueryValid = userQuery.trim().length >= 3 && userQuery.length <= 500;

  // Character count color
  const getCharCountColor = () => {
    if (userQuery.length > 500) return "text-error";
    if (userQuery.length < 3) return "text-warning";
    return "text-success";
  };

  // Stop polling helper
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Start polling function
  const startPolling = useCallback(
    async (hypercardIdToCheck: string) => {
      // Clear existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Poll function
      const pollStatus = async () => {
        try {
          const response = await fetch(`/api/hyperblogs/${hypercardIdToCheck}`);
          if (!response.ok) {
            console.error("Failed to fetch card status:", response.statusText);
            return;
          }

          const data: HyperBlogInfo = await response.json();
          setGenerationStatus(data.generation_status);

          // Update HTN progress if available
          if (data.htn_progress) {
            console.log("HTN progress received:", data.htn_progress);
            setHtnProgress(data.htn_progress);
          }

          if (data.generation_status === "generating") {
            // Keep progress modal open during generation
            setShowProgressModal(true);
          } else if (data.generation_status === "completed") {
            setWordCount(data.word_count);
            setPreview(data.preview);
            setShowProgressModal(false);
            setHtnProgress(null);
            stopPolling();
            const truncatedQuery = userQuery.length > 60 ? userQuery.substring(0, 60) + "..." : userQuery;
            notification.success(`🎁 Card completed: "${truncatedQuery}"!`);
            if (onSuccess) {
              onSuccess(hypercardIdToCheck);
            }
          } else if (data.generation_status === "failed") {
            setShowProgressModal(false);
            setHtnProgress(null);
            stopPolling();
            setError("Card creation failed. Please try again.");
            notification.error("Card creation failed");
          }
        } catch (err) {
          console.error("Error polling card status:", err);
          // Don't stop polling on error - will retry on next interval
        }
      };

      // Call immediately
      await pollStatus();

      // Set up interval
      pollingIntervalRef.current = setInterval(pollStatus, 5000);
    },
    [stopPolling, onSuccess, userQuery],
  );

  // Submit handler
  const handleSubmit = useCallback(async () => {
    // Pre-validation
    if (!isConnected || !address) {
      setError("Please connect your wallet to create a card");
      notification.error("Please connect your wallet");
      return;
    }

    if (userQuery.trim().length < 3 || userQuery.length > 500) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculate payment amount
      let priceUsd: number;

      if (dataroomPrice !== undefined && dataroomPrice > 0) {
        priceUsd = dataroomPrice;
      } else {
        // Fetch dataroom details to get current price
        const dataroomResponse = await fetch(`/api/datarooms/${dataroomId}`);
        if (!dataroomResponse.ok) {
          throw new Error("Failed to fetch bonfire details");
        }
        const dataroomData = await dataroomResponse.json();
        // Use current_hyperblog_price_usd if > 0, otherwise fall back to price_usd
        const dynamicPrice = dataroomData.current_hyperblog_price_usd
          ? parseFloat(dataroomData.current_hyperblog_price_usd)
          : 0;
        priceUsd = dynamicPrice > 0 ? dynamicPrice : dataroomData.price_usd;
      }

      // Set amount as decimal string (buildAndSignPaymentHeader handles conversion)
      const amount = priceUsd.toFixed(2);

      // Build and sign payment
      notification.info("🔐 Signing payment...");
      const paymentHeader = await buildAndSignPaymentHeader(amount);

      if (!paymentHeader) {
        throw new Error("Payment signing cancelled or failed");
      }

      // Build request body
      const requestBody: PurchaseHyperBlogRequest = {
        payment_header: paymentHeader,
        dataroom_id: dataroomId,
        user_query: userQuery.trim(),
        is_public: isPublic,
        blog_length: "short", // Cards use short length (single node, 300-500 words)
        generation_mode: "card", // Use card HTN for single-node generation
      };

      // Call purchase API
      notification.info("🎄 Creating your magical card...");
      const response = await fetch("/api/hyperblogs/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to create card" }));
        throw new Error(errorData.detail || errorData.message || "Failed to create card");
      }

      const data: PurchaseHyperBlogResponse = await response.json();

      // Handle success
      const createdHypercardId = data.hyperblog.id;
      const status = data.hyperblog.generation_status;

      setHypercardId(createdHypercardId);
      setGenerationStatus(status);

      // Store Santa Bonfire access in localStorage if granted
      if (data.santa_bonfire_access) {
        try {
          localStorage.setItem(
            `santa_bonfire_access_${createdHypercardId}`,
            JSON.stringify(data.santa_bonfire_access),
          );
          notification.success("🎄 Card created! You've also unlocked access to Santa's Bonfire! 🎅", {
            duration: 6000,
          });
        } catch (err) {
          console.error("Failed to store Santa Bonfire access:", err);
          notification.success("🎁 Card purchase successful! Creating your magical card...");
        }
      } else {
        notification.success("🎁 Card purchase successful! Creating your magical card...");
      }

      // Start polling if generating
      if (status === "generating") {
        // Show progress modal immediately
        setShowProgressModal(true);
        // Set initial HTN progress if available in response
        if (data.hyperblog.htn_progress) {
          setHtnProgress(data.hyperblog.htn_progress);
        }
        await startPolling(createdHypercardId);
      } else if (status === "completed") {
        setWordCount(data.hyperblog.word_count);
        setPreview(data.hyperblog.preview);
        notification.success("🎁 Card created successfully!");
        if (onSuccess) {
          onSuccess(createdHypercardId);
        }
      }

      setIsLoading(false);
    } catch (err: unknown) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      notification.error(errorMessage);
      setIsLoading(false);
    }
  }, [
    isConnected,
    address,
    userQuery,
    dataroomId,
    dataroomPrice,
    isPublic,
    buildAndSignPaymentHeader,
    startPolling,
    onSuccess,
  ]);

  // Close handler
  const handleClose = useCallback(() => {
    stopPolling();
    onClose();
  }, [stopPolling, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "Enter" && !e.shiftKey && isQueryValid && !isLoading && !isSigningPayment) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isQueryValid, isLoading, isSigningPayment, handleClose, handleSubmit]);

  // Early return if not open
  if (!isOpen) return null;

  return (
    <div className="modal modal-open" onClick={handleClose} role="dialog" aria-label="Create Christmas Card Modal">
      <div
        className="modal-box relative max-w-full sm:max-w-2xl christmas-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Close button */}
        <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={handleClose}>
          ✕
        </button>

        {/* Header */}
        <h3 className="font-bold text-2xl mb-2">🎄 Create Christmas Card</h3>
        <p className="text-sm opacity-70 mb-6">
          Generate a magical Christmas card from Santa&apos;s knowledge graph
        </p>

        {/* Bonfire Preview */}
        {dataroomDescription && (
          <div className="alert alert-info mb-4 christmas-info-box">
            <div>
              <div className="flex items-start gap-2">
                <span className="text-xl">🔥</span>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Santa&apos;s Bonfire:</div>
                  <div className="text-sm opacity-90">
                    {dataroomDescription.length > 100
                      ? dataroomDescription.substring(0, 100) + "..."
                      : dataroomDescription}
                  </div>
                  {dataroomPrice !== undefined && (
                    <div className="mt-2 text-sm font-bold">${dataroomPrice.toFixed(2)} USD</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Connection Check */}
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <p className="text-center text-lg opacity-80">Please connect your wallet to create a card 🎁</p>
            <ConnectButton />
          </div>
        ) : (
          <>
            {/* Form */}
            <div className="space-y-4">
              {/* User Query Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    🎁 Card Message Theme <span className={`text-xs ${getCharCountColor()}`}>({userQuery.length}/500)</span>
                  </span>
                </label>
                <textarea
                  ref={textareaRef}
                  className={`textarea textarea-bordered h-24 sm:h-32 w-full ${
                    !isQueryValid && userQuery.length > 0 ? "textarea-error" : ""
                  }`}
                  placeholder="e.g., 'A warm holiday greeting for family' or 'Christmas wishes for a special friend'"
                  value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                  maxLength={500}
                  disabled={isLoading || generationStatus === "generating"}
                />
                <label className="label">
                  <span className="label-text-alt">Describe your card message theme (3-500 characters)</span>
                </label>
              </div>

              {/* Visibility Toggle */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                    disabled={isLoading || generationStatus === "generating"}
                  />
                  <span className="label-text">Share card publicly (visible in Santa&apos;s gallery) 🌟</span>
                </label>
              </div>

              {/* Error Display */}
              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}

              {/* Generation Status Display - Hidden when progress modal is shown */}
              {hypercardId && !showProgressModal && (
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold">Status:</span>
                      {generationStatus === "generating" && (
                        <span className="badge badge-warning gap-2">
                          <span className="loading loading-spinner loading-xs"></span>
                          🎄 Creating Magic...
                        </span>
                      )}
                      {generationStatus === "completed" && <span className="badge badge-success">🎁 Ready</span>}
                      {generationStatus === "failed" && <span className="badge badge-error">❌ Failed</span>}
                    </div>

                    {generationStatus === "completed" && wordCount && (
                      <div className="text-sm space-y-2">
                        <p>
                          <span className="font-semibold">Message Length:</span> {wordCount.toLocaleString()} words
                        </p>
                        {preview && (
                          <div>
                            <p className="font-semibold mb-1">Preview:</p>
                            <p className="text-xs opacity-80 italic">{preview}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {generationStatus === "generating" && (
                      <p className="text-sm opacity-70">
                        Your card is being created with holiday magic. This may take 30-60 seconds. You can close this and check back later.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="modal-action">
              {!hypercardId ? (
                <>
                  <button className="btn" onClick={handleClose} disabled={isLoading}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={!isQueryValid || isLoading || isSigningPayment}
                  >
                    {isSigningPayment ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Signing Payment...
                      </>
                    ) : isLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Creating...
                      </>
                    ) : (
                      "🎁 Create Card"
                    )}
                  </button>
                </>
              ) : generationStatus === "completed" ? (
                <>
                  <button className="btn" onClick={handleClose}>
                    Close
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      if (onSuccess && hypercardId) {
                        onSuccess(hypercardId);
                      }
                      handleClose();
                    }}
                  >
                    🎁 View Card
                  </button>
                </>
              ) : (
                <button className="btn" onClick={handleClose}>
                  Close
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* HTN Progress Modal - Overlays on top of the main modal */}
      <HyperCardProgressModal
        isOpen={showProgressModal}
        htnProgress={htnProgress}
        userQuery={userQuery}
        onClose={() => setShowProgressModal(false)}
      />
    </div>
  );
};

