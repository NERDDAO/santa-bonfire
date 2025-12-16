"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HyperCardCreator } from "@/components/HyperCardCreator";
import type { CenterNodeInfo, DataRoomInfo, DataRoomPreviewResponse } from "@/lib/types/delve-api";
import { formatTimestamp, truncateAddress, truncateText } from "@/lib/utils";
import { notification } from "@/utils/scaffold-eth/notification";
import { useAccount } from "wagmi";

interface PreviewEntity {
  uuid?: string;
  id?: string;
  entity_type?: string;
  name?: string;
  summary?: string;
}

interface DataRoomMarketplaceCardProps {
  dataroom: DataRoomInfo;
  className?: string;
  onHyperCardCreated?: (dataroomId: string) => void;
}

export function DataRoomMarketplaceCard({
  dataroom,
  className = "",
  onHyperCardCreated,
}: DataRoomMarketplaceCardProps) {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [preview, setPreview] = useState<DataRoomPreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isHyperCardModalOpen, setIsHyperCardModalOpen] = useState(false);
  const [centerNodeInfo, setCenterNodeInfo] = useState<CenterNodeInfo | null>(null);
  const [centerNodeLoading, setCenterNodeLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const centerNodeAbortRef = useRef<AbortController | null>(null);

  const handleOpenHyperCardModal = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    setIsHyperCardModalOpen(true);
  };

  const handleCloseHyperCardModal = () => {
    setIsHyperCardModalOpen(false);
  };

  const handleHyperCardSuccess = (hypercardId: string) => {
    notification.success(`🎁 Card created successfully! ID: ${hypercardId}`);
    onHyperCardCreated?.(dataroom.id);
    setIsHyperCardModalOpen(false);
    console.log("Christmas Card created:", hypercardId);
  };

  // Fetch preview when expanded
  const fetchPreview = async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingPreview(true);
    setPreviewError(null);

    try {
      const response = await fetch(`/api/datarooms/${dataroom.id}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: DataRoomPreviewResponse = await response.json();
      setPreview(data);
    } catch (err: unknown) {
      // Ignore abort errors
      if (err instanceof Error && err.name === "AbortError") return;

      const errorMessage = err instanceof Error ? err.message : "Failed to load preview";
      setPreviewError(errorMessage);
      console.error("Error fetching preview:", err);
    } finally {
      setLoadingPreview(false);
      abortControllerRef.current = null;
    }
  };

  // Fetch center node info by UUID (direct lookup, no delve query)
  const fetchCenterNodeInfo = async () => {
    if (!dataroom.center_node_uuid) return;

    // Abort any existing request
    if (centerNodeAbortRef.current) {
      centerNodeAbortRef.current.abort();
    }

    centerNodeAbortRef.current = new AbortController();
    setCenterNodeLoading(true);

    try {
      // Direct entity lookup by UUID - much cheaper than delve
      const url = new URL(`/api/knowledge_graph/entity/${dataroom.center_node_uuid}`, window.location.origin);
      if (dataroom.bonfire_id) {
        url.searchParams.append("bonfire_id", dataroom.bonfire_id);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: centerNodeAbortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch center node: ${response.statusText}`);
      }

      const entity = await response.json();

      if (entity) {
        setCenterNodeInfo({
          uuid: entity.uuid || entity.id || dataroom.center_node_uuid,
          name: entity.name || "Unknown Node",
          entity_type: entity.entity_type || entity.type || "unknown",
          summary: entity.summary || entity.description || "",
          labels: entity.labels || [],
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Failed to fetch center node info:", err);
    } finally {
      setCenterNodeLoading(false);
    }
  };

  // Handle preview toggle with debouncing
  const handlePreviewToggle = () => {
    const newExpanded = !isPreviewExpanded;
    setIsPreviewExpanded(newExpanded);

    if (newExpanded && !preview && !loadingPreview) {
      // Debounce the fetch by 300ms
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        fetchPreview();
      }, 300);
    }
  };

  // Fetch center node info only when preview is expanded (not on mount)
  useEffect(() => {
    if (isPreviewExpanded && dataroom.center_node_uuid && !centerNodeInfo && !centerNodeLoading) {
      fetchCenterNodeInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataroom.center_node_uuid]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (centerNodeAbortRef.current) {
        centerNodeAbortRef.current.abort();
      }
    };
  }, []);

  const truncatedDescription = truncateText(dataroom.description, 150);
  const shouldTruncate = dataroom.description.length > 150;

  const handleCardClick = () => {
    router.push(`/data-rooms/${dataroom.id}`);
  };

  return (
    <div
      className={`dataroom-card cursor-pointer ${className}`}
      onClick={handleCardClick}
    >
      <div className="dataroom-card-body">
        {/* Header Section - Description as Title */}
        <div className="flex items-start justify-between mb-2 gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span className="text-2xl mt-0.5">🔥</span>
            <div className="flex-1 min-w-0">
              <h3 className="card-title text-lg leading-tight mb-2">
                {truncateText(dataroom.description, 100) || "Untitled Writer's Room"}
              </h3>
              {/* Writer's Room Badge */}
              <span className="badge badge-info badge-sm">
                {dataroom.bonfire_name || truncateAddress(dataroom.bonfire_id, 6)}
              </span>
            </div>
          </div>
          {dataroom.is_active ? (
            <span className="badge badge-success badge-sm flex-shrink-0">🎄 Active</span>
          ) : (
            <span className="badge badge-ghost badge-sm flex-shrink-0">Inactive</span>
          )}
        </div>

        {/* Creator Badge */}
        <div className="mb-2">
          <span className="badge badge-outline badge-sm">
            by{" "}
            {dataroom.creator_name ||
              dataroom.creator_username ||
              (dataroom.creator_wallet ? truncateAddress(dataroom.creator_wallet, 6) : "Anonymous")}
          </span>
        </div>

        {/* Full Description (only if longer than 100 chars) */}
        {shouldTruncate && (
          <div className="mb-3">
            <p className="text-sm opacity-80">{isDescriptionExpanded ? dataroom.description : truncatedDescription}</p>
            <button
              className="btn btn-ghost btn-xs mt-1"
              onClick={e => {
                e.stopPropagation();
                setIsDescriptionExpanded(!isDescriptionExpanded);
              }}
            >
              {isDescriptionExpanded ? "Show less" : "Read more"}
            </button>
          </div>
        )}

        {/* Pricing & Limits Section */}
        <div className="dataroom-section-highlight p-3 mb-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span>💰</span>
              <span className="font-semibold">
                $
                {dataroom.current_hyperblog_price_usd && parseFloat(dataroom.current_hyperblog_price_usd) > 0
                  ? dataroom.current_hyperblog_price_usd
                  : dataroom.price_usd.toFixed(2)}{" "}
                USD
              </span>
              {dataroom.dynamic_pricing_enabled && <span className="badge badge-warning badge-xs">Dynamic ▲</span>}
              {dataroom.dynamic_pricing_enabled && dataroom.total_purchases === 0 && (
                <span className="badge badge-success badge-xs">No protocol fee! 🎁</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span>📊</span>
              <span>{dataroom.query_limit} queries</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⏰</span>
              <span>{dataroom.expiration_days} days</span>
            </div>
          </div>
        </div>

        {/* Center Node Info Section */}
        {dataroom.center_node_uuid && (
          <div className="mb-3 dataroom-section-highlight p-3">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-base-content/70 uppercase tracking-wide">
              <span>🎯</span>
              <span>Focus Node</span>
            </div>
            {centerNodeLoading ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="loading loading-spinner loading-xs"></span>
                <span className="opacity-70">Loading node info...</span>
              </div>
            ) : centerNodeInfo ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {centerNodeInfo.entity_type && (
                    <span className="badge badge-primary badge-outline badge-xs">{centerNodeInfo.entity_type}</span>
                  )}
                  <span className="font-semibold text-sm text-base-content/90">{centerNodeInfo.name}</span>
                </div>
                {centerNodeInfo.summary && (
                  <p className="text-xs text-base-content/60 leading-relaxed line-clamp-2">
                    {truncateText(centerNodeInfo.summary, 80)}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-xs text-base-content/50">{truncateAddress(dataroom.center_node_uuid, 8)}</div>
            )}
          </div>
        )}

        {/* Configuration Indicators */}
        <div className="flex flex-wrap gap-2 mb-3">
          {dataroom.system_prompt && <span className="badge badge-accent badge-sm">🤖 Custom AI Prompt</span>}
        </div>

        {/* Preview Section */}
        {isPreviewExpanded && (
          <div className="mb-3 border-t pt-3">
            {loadingPreview ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="loading loading-spinner loading-xs"></span>
                <span className="opacity-70">Loading preview...</span>
              </div>
            ) : previewError ? (
              <div className="alert alert-error alert-sm">
                <span className="text-xs">{previewError}</span>
              </div>
            ) : preview && preview.entities.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold opacity-80">Preview Entities:</p>
                <div className="space-y-1">
                  {(preview.entities as PreviewEntity[]).slice(0, 5).map(entity => (
                    <div key={entity.uuid || entity.id} className="text-xs bg-base-200 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-xs badge-primary">{entity.entity_type || "Entity"}</span>
                        <span className="font-semibold">{entity.name || "Unnamed"}</span>
                      </div>
                      {entity.summary && <p className="opacity-70 mt-1 line-clamp-2">{entity.summary}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs opacity-70">No preview entities available</p>
            )}
          </div>
        )}

        {/* Preview Toggle Button */}
        <button
          className="btn btn-ghost btn-xs mb-3 w-full"
          onClick={e => {
            e.stopPropagation();
            handlePreviewToggle();
          }}
        >
          {isPreviewExpanded ? "Hide Preview" : "Show Preview"}
        </button>

        {/* Metadata Row */}
        <div className="text-xs opacity-70 mb-4">Created {formatTimestamp(dataroom.created_at)}</div>

        {/* Card Actions */}
        <div className="dataroom-card-actions flex-wrap" onClick={e => e.stopPropagation()}>
          {/* Create Christmas Card Button */}
          {dataroom.is_active ? (
            isConnected ? (
              <button className="btn btn-primary btn-sm" onClick={handleOpenHyperCardModal}>
                🎁 Create Card
              </button>
            ) : (
              <div className="tooltip" data-tip="Connect wallet to create card">
                <button className="btn btn-primary btn-sm" disabled>
                  🎁 Create Card
                </button>
              </div>
            )
          ) : (
            <div className="tooltip" data-tip="Writer's Room is inactive">
              <button className="btn btn-primary btn-sm" disabled>
                🎁 Create Card
              </button>
            </div>
          )}
        </div>
      </div>
      <HyperCardCreator
        dataroomId={dataroom.id}
        dataroomDescription={dataroom.description}
        dataroomPrice={
          dataroom.current_hyperblog_price_usd && parseFloat(dataroom.current_hyperblog_price_usd) > 0
            ? parseFloat(dataroom.current_hyperblog_price_usd)
            : dataroom.price_usd
        }
        isOpen={isHyperCardModalOpen}
        onClose={handleCloseHyperCardModal}
        onSuccess={handleHyperCardSuccess}
      />
    </div>
  );
}

