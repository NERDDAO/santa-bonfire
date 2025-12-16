"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { HyperCardDetail } from "./HyperCardDetail";
import { AggregatedHyperBlogListResponse, HyperBlogInfo, HyperBlogListResponse } from "@/lib/types/delve-api";
import { calculateReadingTime } from "@/lib/utils";
import { notification } from "@/utils/scaffold-eth/notification";
import { AlertCircle, Clock, Eye, Maximize2, MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";

interface HyperCardFeedProps {
  dataroomId?: string; // Optional: Bonfire to fetch cards from (omit for aggregated mode)
  showFilters?: boolean; // Optional: Show/hide filter controls (default: false)
  title?: string; // Optional: Section title (default: "Christmas Cards")
  autoRefreshInterval?: number; // Optional: Auto-refresh interval in ms (default 30000)
  initialLimit?: number; // Optional: Initial number of cards to load (default 10)
  className?: string; // Optional: Additional CSS classes
  displayMode?: "list" | "gallery"; // Optional: Display mode (default: "list")
  generationMode?: "blog" | "card"; // Optional: Filter by generation mode
}

/**
 * HyperCardFeed Component
 *
 * Displays a paginated, auto-refreshing list of Christmas cards.
 * Supports two modes:
 * 1. Bonfire-specific mode (when dataroomId is provided): Shows cards from single bonfire
 * 2. Aggregated mode (when dataroomId is omitted): Shows cards from all bonfires with filters
 */
export const HyperCardFeed = ({
  dataroomId,
  showFilters = false,
  title = "Christmas Cards",
  autoRefreshInterval = 30000,
  initialLimit = 10,
  className = "",
  displayMode = "list",
  generationMode,
}: HyperCardFeedProps) => {
  // Data State
  const [cards, setCards] = useState<HyperBlogInfo[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentOffset, setCurrentOffset] = useState<number>(0);
  const [currentLimit, setCurrentLimit] = useState<number>(initialLimit);

  // Loading/Error State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedCard, setSelectedCard] = useState<HyperBlogInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Filter State (for aggregated mode)
  const [selectedBonfireFilter, setSelectedBonfireFilter] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardsRef = useRef<HyperBlogInfo[]>([]);
  const isInitialMountRef = useRef<boolean>(true);

  // Keep cardsRef in sync with cards state
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  /**
   * Main fetch function to load cards from API
   */
  const fetchCards = useCallback(
    async (offset: number, limit: number, append: boolean) => {
      try {
        // Cancel any pending request
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        // Set loading state
        if (append) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        // Build API URL based on mode
        let apiUrl: string;
        if (dataroomId) {
          // Bonfire-specific mode
          apiUrl = `/api/datarooms/${dataroomId}/hyperblogs?limit=${limit}&offset=${offset}`;
        } else {
          // Aggregated mode
          apiUrl = `/api/hyperblogs?limit=${limit}&offset=${offset}`;
          // Add filters for aggregated mode
          if (selectedBonfireFilter) {
            apiUrl += `&dataroom_id=${selectedBonfireFilter}`;
          }
          if (selectedStatusFilter) {
            apiUrl += `&status=${selectedStatusFilter}`;
          }
          // Add generation_mode filter if provided
          if (generationMode) {
            apiUrl += `&generation_mode=${generationMode}`;
          }
        }

        // Fetch from API
        const response = await fetch(apiUrl, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data: HyperBlogListResponse | AggregatedHyperBlogListResponse = await response.json();

        // Handle success
        if (append) {
          // Deduplicate and append new cards using ref
          const existingIds = new Set(cardsRef.current.map(c => c.id));
          const newCards = data.hyperblogs.filter(c => !existingIds.has(c.id));
          setCards(prev => [...prev, ...newCards]);
        } else {
          // Replace cards array
          setCards(data.hyperblogs);
        }

        setTotalCount(data.count);
        setCurrentOffset(offset);
        setCurrentLimit(limit);
      } catch (err: unknown) {
        // Handle abort gracefully
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        // Parse error message
        let errorMessage = "Unable to load cards. Please check your connection.";
        if (err instanceof Error) {
          if (err.message.includes("404")) {
            errorMessage = dataroomId ? "Bonfire not found" : "Endpoint not found";
          } else if (err.message.includes("500")) {
            errorMessage = "Server error. Please try again later.";
          } else if (err.message.includes("timeout")) {
            errorMessage = "Request timed out. Please try again.";
          } else if (err.message) {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        notification.error(errorMessage);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        abortControllerRef.current = null;
      }
    },
    [dataroomId, selectedBonfireFilter, selectedStatusFilter, generationMode],
  );

  /**
   * Initial load effect
   */
  useEffect(() => {
    fetchCards(0, initialLimit, false);

    // Cleanup: abort pending requests
    return () => {
      abortControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Filter change effect - triggers immediate refetch when filters change
   */
  useEffect(() => {
    // Skip on initial mount - the initial load effect handles that
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Clear any existing error state
    setError(null);

    // Abort any in-flight request
    abortControllerRef.current?.abort();

    // Trigger immediate refetch with reset pagination
    fetchCards(0, initialLimit, false);
  }, [selectedBonfireFilter, selectedStatusFilter, dataroomId, fetchCards, initialLimit]);

  /**
   * Auto-refresh effect
   */
  useEffect(() => {
    // Only start if autoRefreshInterval > 0
    if (autoRefreshInterval <= 0) {
      return;
    }

    // Setup interval
    refreshIntervalRef.current = setInterval(() => {
      // Fetch first page to get latest cards
      fetchCards(0, currentLimit, false);
    }, autoRefreshInterval);

    // Cleanup: clear interval
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [dataroomId, autoRefreshInterval, currentLimit, fetchCards]);

  /**
   * Handler: Load next page
   */
  const handleLoadMore = useCallback(() => {
    // Debounce to prevent double-fetches
    if (debounceTimeoutRef.current) {
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      debounceTimeoutRef.current = null;
    }, 300);

    const nextOffset = currentOffset + currentLimit;
    fetchCards(nextOffset, currentLimit, true);
  }, [currentOffset, currentLimit, fetchCards]);

  /**
   * Handler: Retry after error
   */
  const handleRetry = useCallback(() => {
    setError(null);
    fetchCards(0, initialLimit, false);
  }, [initialLimit, fetchCards]);

  /**
   * Handler: Close modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedCard(null);
    }, 300);
  }, []);

  /**
   * Handler: Open card in modal
   * Note: Primary interaction is now via Link, this is fallback
   */
  const handleOpenCard = useCallback((card: HyperBlogInfo, e?: React.MouseEvent) => {
    // Prevent navigation and propagation when opening modal
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setSelectedCard(card);
    setIsModalOpen(true);
  }, []);

  /**
   * Computed values
   */
  const hasMore = useMemo(() => cards.length < totalCount, [cards.length, totalCount]);
  const isEmpty = useMemo(() => !isLoading && cards.length === 0 && !error, [isLoading, cards.length, error]);

  /**
   * Get unique bonfire IDs from loaded cards (for filter dropdown)
   */
  const uniqueBonfireIds = useMemo(() => {
    const ids = new Set(cards.map(c => c.dataroom_id));
    return Array.from(ids);
  }, [cards]);

  /**
   * Build a mapping from dataroom_id to description for filter dropdown display
   */
  const bonfireDescriptions = useMemo(() => {
    const descriptions = new Map<string, string>();
    for (const card of cards) {
      if (!descriptions.has(card.dataroom_id)) {
        // Use description if available, otherwise fallback to truncated ID
        descriptions.set(card.dataroom_id, card.dataroom_description || card.dataroom_id.substring(0, 8) + "...");
      }
    }
    return descriptions;
  }, [cards]);

  /**
   * Handler: Clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setSelectedBonfireFilter(null);
    setSelectedStatusFilter(null);
  }, []);

  /**
   * Utility: Format timestamp
   */
  const formatTimestamp = (timestamp: string | number): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown date";
    }
  };

  /**
   * Utility: Truncate address
   */
  const truncateAddress = (address: string, chars: number = 6): string => {
    if (!address) return "Unknown";
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  };

  /**
   * Utility: Truncate bonfire description for filter dropdown
   */
  const truncateDescription = (description: string | null | undefined, maxLength: number = 50): string => {
    if (!description || description.trim() === "") return "Unknown Bonfire";
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength) + "...";
  };

  /**
   * Utility: Get status badge with Christmas theming
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generating":
        return (
          <span className="badge badge-warning gap-1" aria-label="Status: Creating Magic">
            <span className="loading loading-spinner loading-xs" aria-hidden="true"></span>
            🎄 Creating
          </span>
        );
      case "completed":
        return (
          <span className="badge badge-success gap-1" aria-label="Status: Ready">
            🎁 Ready
          </span>
        );
      case "failed":
        return (
          <span className="badge badge-error gap-1" aria-label="Status: Failed">
            ❌ Failed
          </span>
        );
      default:
        return (
          <span className="badge badge-ghost gap-1" aria-label={`Status: ${status}`}>
            {status}
          </span>
        );
    }
  };

  /**
   * Utility: Smart truncate preview text at sentence boundaries
   */
  const truncatePreviewSmart = (preview: string | null, maxLength: number = 280): string => {
    if (!preview) return "No preview available";
    if (preview.length <= maxLength) return preview;

    // Look for sentence boundary within the last 20% of the allowed length
    const truncationZoneStart = Math.floor(maxLength * 0.8);
    const truncationZone = preview.slice(truncationZoneStart, maxLength);

    // Find the last sentence terminator in the zone
    const regex = /[.!?](?=\s|$)/g;
    let lastSentenceEnd = -1;
    let match;
    while ((match = regex.exec(truncationZone)) !== null) {
      lastSentenceEnd = match.index;
    }

    if (lastSentenceEnd !== -1) {
      // Found a sentence boundary
      const truncated = preview.slice(0, truncationZoneStart + lastSentenceEnd + 1);
      if (truncated.length < preview.length) {
        return truncated + " ...";
      }
      return truncated;
    }

    // Fallback to word boundary
    const lastSpace = preview.lastIndexOf(" ", maxLength);
    if (lastSpace > truncationZoneStart) {
      return preview.slice(0, lastSpace) + "...";
    }

    // Hard fallback
    return preview.slice(0, maxLength) + "...";
  };

  return (
    <div className={`space-y-4 ${className}`} aria-label="Christmas Card Feed">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            🎄 {title || "Christmas Cards"}
            {totalCount > 0 && <span className="badge badge-neutral">{totalCount}</span>}
          </h3>
          {!dataroomId && <p className="text-sm opacity-70 mt-1">Latest from Santa&apos;s Workshop</p>}
          {dataroomId && <p className="text-sm opacity-70 mt-1">From this Bonfire</p>}
        </div>
        {!isLoading && cards.length > 0 && (
          <div className="text-xs opacity-70 flex items-center gap-1">
            {autoRefreshInterval > 0 && (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Auto-refreshing
              </>
            )}
          </div>
        )}
      </div>

      {/* Filters Section (only show if showFilters is true and not in bonfire-specific mode) */}
      {showFilters && !dataroomId && (
        <div className="bg-base-200 p-4 rounded-lg mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="text-sm font-semibold opacity-70 flex-shrink-0">🔍 Filter by:</div>

            {/* Bonfire Filter */}
            <div className="flex-1">
              <select
                className="select select-sm select-bordered w-full"
                value={selectedBonfireFilter || ""}
                onChange={e => setSelectedBonfireFilter(e.target.value || null)}
                aria-label="Filter by Bonfire"
              >
                <option value="">All Bonfires</option>
                {uniqueBonfireIds.map(id => (
                  <option key={id} value={id}>
                    {truncateDescription(bonfireDescriptions.get(id), 50)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex-1">
              <select
                className="select select-sm select-bordered w-full"
                value={selectedStatusFilter || ""}
                onChange={e => setSelectedStatusFilter(e.target.value || null)}
                aria-label="Filter by Status"
              >
                <option value="">All Statuses</option>
                <option value="generating">🎄 Creating</option>
                <option value="completed">🎁 Ready</option>
                <option value="failed">❌ Failed</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(selectedBonfireFilter || selectedStatusFilter) && (
              <button
                className="btn btn-sm btn-ghost flex-shrink-0"
                onClick={handleClearFilters}
                aria-label="Clear all filters"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading State (Initial) */}
      {isLoading && cards.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-32 w-full"></div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && cards.length === 0 && (
        <div className="alert alert-error">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button className="btn btn-sm btn-primary" onClick={handleRetry}>
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="text-center py-12 opacity-70">
          <div className="text-6xl mb-4">🎄</div>
          {dataroomId ? (
            <p className="text-lg">No cards yet for this Bonfire. Create the first magical card!</p>
          ) : (
            <p className="text-lg">No Christmas cards available yet. Visit a Bonfire to create one!</p>
          )}
        </div>
      )}

      {/* Card List */}
      {cards.length > 0 && (
        <div
          className={
            displayMode === "gallery"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {cards.map(card =>
            displayMode === "gallery" ? (
              /* Gallery Mode Card */
              <Link
                key={card.id}
                href={`/hyperblogs/${card.id}`}
                passHref
                className="block no-underline group animate-slide-up"
              >
                <div
                  className="gallery-card group"
                  role="button"
                  tabIndex={0}
                  aria-label={`Christmas card: ${card.user_query}`}
                >
                  {/* Image Section */}
                  <div className="gallery-card-image">
                    {card.banner_url ? (
                      <img
                        src={card.banner_url}
                        alt={card.user_query}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="gallery-card-placeholder">
                        <span className="text-5xl mb-2">
                          {card.generation_status === "generating"
                            ? "🎄"
                            : card.generation_status === "completed"
                              ? "🎁"
                              : "❄️"}
                        </span>
                        <span className="text-sm text-base-content/60 px-4 text-center line-clamp-2">
                          {card.user_query.substring(0, 50)}
                          {card.user_query.length > 50 ? "..." : ""}
                        </span>
                      </div>
                    )}
                    {/* Status Badge Overlay */}
                    {card.generation_status !== "completed" && (
                      <div className="absolute top-2 right-2">{getStatusBadge(card.generation_status)}</div>
                    )}
                  </div>

                  {/* Metadata Section */}
                  <div className="gallery-card-content">
                    <h4 className="text-lg font-bold font-serif line-clamp-2 text-base-content group-hover:text-christmas-red transition-colors">
                      🎁 {card.user_query}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-base-content/60">
                      <span className="font-medium">by {truncateAddress(card.author_wallet, 4)}</span>
                      <span>•</span>
                      <span>
                        {new Date(card.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              /* List Mode Card (Original) */
              <Link
                key={card.id}
                href={`/hyperblogs/${card.id}`}
                passHref
                className="block no-underline group animate-slide-up"
              >
                <div
                  className="card-minimal group-hover:translate-y-[-2px] christmas-card-hover"
                  role="button"
                  tabIndex={0}
                  aria-label={`Christmas card: ${card.user_query}`}
                >
                  <div className="relative w-full">
                    {/* Status Badge */}
                    <div className="absolute top-0 right-0">{getStatusBadge(card.generation_status)}</div>

                    {/* Title */}
                    <h4 className="text-xl sm:text-2xl font-bold font-serif mb-3 pr-24 line-clamp-2 text-base-content group-hover:text-christmas-red transition-colors">
                      🎁 {card.user_query}
                    </h4>

                    {/* Preview Text - prefer summary over truncated preview */}
                    <div className="relative mb-6">
                      <p className="text-base text-base-content/80 leading-relaxed line-clamp-4">
                        {card.summary || truncatePreviewSmart(card.preview, 280)}
                      </p>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/60">
                      {/* Bonfire badge (only in aggregated mode) */}
                      {!dataroomId && (
                        <>
                          <span className="badge badge-outline badge-sm">
                            🔥 {card.dataroom_id.substring(0, 8)}...
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span className="font-medium text-base-content/80">
                        by {truncateAddress(card.author_wallet, 6)}
                      </span>
                      <span>•</span>
                      <span>{formatTimestamp(card.created_at)}</span>
                      {card.generation_status === "completed" && card.word_count && (
                        <>
                          <span>•</span>
                          <span>{card.word_count} words</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {calculateReadingTime(card.word_count)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Taxonomy Keywords Badges */}
                    {card.taxonomy_keywords && card.taxonomy_keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3" aria-label="Keywords">
                        <span className="text-xs opacity-60 mr-1">🏷️</span>
                        {card.taxonomy_keywords.slice(0, 5).map((keyword, idx) => (
                          <span key={idx} className="badge badge-primary badge-sm">
                            {keyword}
                          </span>
                        ))}
                        {card.taxonomy_keywords.length > 5 && (
                          <span className="badge badge-ghost badge-sm">+{card.taxonomy_keywords.length - 5} more</span>
                        )}
                      </div>
                    )}

                    {/* Interaction Row Preview (Non-interactive in card, just visual) */}
                    {card.generation_status === "completed" && (
                      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-base-content/5 text-base-content/60">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm hover:text-primary transition-colors">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{card.upvotes || 0}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs sm:text-sm hover:text-primary transition-colors">
                          <ThumbsDown className="w-4 h-4" />
                          <span>{card.downvotes || 0}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs sm:text-sm hover:text-primary transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          <span>{card.comment_count || 0}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs sm:text-sm px-2 ml-auto">
                          <Eye className="w-4 h-4 opacity-70" />
                          <span>{card.view_count || 0}</span>
                        </div>

                        <button
                          className="btn btn-ghost btn-xs gap-1 z-10 relative hover:bg-base-200 ml-2"
                          onClick={e => handleOpenCard(card, e)}
                          aria-label="Preview Card"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Preview</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ),
          )}
        </div>
      )}

      {/* Load More Section */}
      {hasMore && !isLoading && (
        <div className="space-y-2">
          <button className="btn btn-outline btn-block" onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Loading...
              </>
            ) : (
              "🎁 Show More Cards"
            )}
          </button>
          <div className="text-center text-sm opacity-70">
            Showing {cards.length} of {totalCount}
          </div>
        </div>
      )}

      {/* All Loaded Message */}
      {!hasMore && cards.length > 0 && (
        <div className="text-center text-sm opacity-70 py-4">🎄 All cards loaded ({totalCount} total)</div>
      )}

      {/* Modal Component (Full Card View) - Reusing HyperCardDetail */}
      {isModalOpen && selectedCard && (
        <div className="modal modal-open backdrop-blur-sm" onClick={handleCloseModal} role="dialog" aria-modal="true">
          <div
            className="modal-box max-w-full sm:max-w-5xl lg:max-w-6xl max-h-[90vh] p-8 sm:p-10 overflow-hidden flex flex-col bg-base-100 rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <HyperCardDetail blog={selectedCard} onBack={handleCloseModal} showBackButton={true} />
          </div>
        </div>
      )}
    </div>
  );
};

