"use client";

import React from "react";
import { HyperBlogHTNProgress } from "@/lib/types/delve-api";

interface HyperCardProgressModalProps {
  isOpen: boolean;
  htnProgress: HyperBlogHTNProgress | null;
  userQuery: string;
  onClose?: () => void;
}

export const HyperCardProgressModal: React.FC<HyperCardProgressModalProps> = ({
  isOpen,
  htnProgress,
  userQuery,
  onClose,
}) => {
  if (!isOpen) return null;

  const truncatedQuery = userQuery.length > 100 ? userQuery.substring(0, 100) + "..." : userQuery;

  // Get status icon and styling for each node
  const getNodeStatusDisplay = (status: "pending" | "in_progress" | "completed" | "failed") => {
    switch (status) {
      case "completed":
        return {
          icon: "✓",
          className: "text-success opacity-70",
          bgClass: "bg-success/10",
          borderClass: "",
        };
      case "in_progress":
        return {
          icon: null,
          isSpinner: true,
          className: "text-christmas-red",
          bgClass: "bg-christmas-red/10",
          borderClass: "border-2 border-christmas-red",
        };
      case "failed":
        return {
          icon: "✗",
          className: "text-error",
          bgClass: "bg-error/10",
          borderClass: "border-2 border-error",
        };
      case "pending":
      default:
        return {
          icon: "○",
          className: "text-base-content/40",
          bgClass: "",
          borderClass: "",
        };
    }
  };

  return (
    <div className="modal modal-open z-50" role="dialog" aria-label="Card Creation Progress" aria-modal="true">
      <div
        className="modal-box relative max-w-xl christmas-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "85vh", overflowY: "auto" }}
      >
        {/* Header Section */}
        <div className="mb-6">
          <h3 className="font-bold text-xl mb-1 flex items-center gap-2">
            <span className="loading loading-spinner loading-sm text-christmas-red"></span>
            🎄 Creating Your Christmas Card
          </h3>
          <p className="text-sm opacity-70 italic">&quot;{truncatedQuery}&quot;</p>
        </div>

        {/* Loading State - No HTN Progress Yet */}
        {!htnProgress ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="loading loading-dots loading-lg text-christmas-red"></div>
            <p className="text-sm opacity-70">✨ Gathering holiday magic...</p>
          </div>
        ) : (
          <>
            {/* Overall Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  🎁 {htnProgress.completed_nodes}/{htnProgress.total_nodes} sections complete
                </span>
                <span className="text-sm font-bold text-christmas-red">{Math.round(htnProgress.progress_percentage)}%</span>
              </div>
              <progress
                className="progress progress-primary w-full h-3"
                value={htnProgress.progress_percentage}
                max="100"
              />
            </div>

            {/* Current Step Highlight */}
            {htnProgress.current_node_name && (
              <div className="alert alert-info mb-4 py-2 christmas-info-box">
                <div className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-xs"></span>
                  <span className="text-sm">
                    <span className="font-semibold">✨ Adding holiday cheer:</span> {htnProgress.current_node_name}
                  </span>
                </div>
              </div>
            )}

            {/* HTN Steps List */}
            <div className="space-y-2 mb-6">
              {[...htnProgress.nodes]
                .sort((a, b) => a.order - b.order)
                .map(node => {
                  const statusDisplay = getNodeStatusDisplay(node.status);
                  const isCurrentNode = node.id === htnProgress.current_node_id;

                  return (
                    <div
                      key={node.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${statusDisplay.bgClass} ${statusDisplay.borderClass} ${isCurrentNode ? "shadow-sm" : ""}`}
                    >
                      {/* Step Number Badge */}
                      <div
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                          node.status === "completed"
                            ? "bg-christmas-green text-white"
                            : node.status === "in_progress"
                              ? "bg-christmas-red text-white"
                              : node.status === "failed"
                                ? "bg-error text-error-content"
                                : "bg-base-300 text-base-content/50"
                        }`}
                      >
                        {node.order}
                      </div>

                      {/* Node Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${statusDisplay.className}`}>{node.name}</span>
                          {node.word_count !== undefined && node.status === "completed" && (
                            <span className="badge badge-ghost badge-xs">{node.word_count} words</span>
                          )}
                        </div>
                        {node.description && (
                          <p className="text-xs opacity-60 mt-0.5 truncate">
                            {node.description.length > 80
                              ? node.description.substring(0, 80) + "..."
                              : node.description}
                          </p>
                        )}
                      </div>

                      {/* Status Icon */}
                      <div className={`flex-shrink-0 ${statusDisplay.className}`}>
                        {statusDisplay.isSpinner ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <span className="text-lg">{statusDisplay.icon}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Estimated Time Remaining */}
            {htnProgress.estimated_time_remaining !== undefined && htnProgress.estimated_time_remaining > 0 && (
              <div className="text-center text-sm opacity-70 mb-4">
                ⏰ Estimated time remaining: ~{Math.ceil(htnProgress.estimated_time_remaining / 60)} min
              </div>
            )}
          </>
        )}

        {/* Footer Section */}
        <div className="border-t border-base-300 pt-4 mt-4">
          <p className="text-xs text-center opacity-60">
            🎅 This may take 30-90 seconds. You can close this and check back later.
          </p>
          {onClose && (
            <div className="flex justify-center mt-3">
              <button className="btn btn-ghost btn-sm" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

