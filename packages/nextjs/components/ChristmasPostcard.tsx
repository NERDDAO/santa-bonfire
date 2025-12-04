"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { MarkdownRenderer } from "./MarkdownRenderer";
import type { HyperBlogInfo } from "@/lib/types/delve-api";
import { notification } from "@/utils/scaffold-eth/notification";
import { Download, RefreshCw, Share2 } from "lucide-react";

interface ChristmasPostcardProps {
  blog: HyperBlogInfo;
  className?: string;
  onImageGenerated?: (bannerUrl: string) => void;
}

/**
 * ChristmasPostcard Component
 * 
 * Displays a hyperblog card in a beautiful vintage postcard style format.
 * Features:
 * - Front side: Generated Christmas image
 * - Back side: Message content styled like a handwritten postcard
 * - Decorative stamp, postmark, and vintage borders
 * - Download and share functionality
 */
export const ChristmasPostcard = ({ blog, className = "", onImageGenerated }: ChristmasPostcardProps) => {
  // Debug logging on mount
  console.log("🎄 ChristmasPostcard mounted:", {
    blogId: blog.id,
    hasImagePrompt: !!blog.image_prompt,
    imagePromptPreview: blog.image_prompt ? blog.image_prompt.substring(0, 100) + "..." : null,
    bannerUrl: blog.banner_url,
    generationStatus: blog.generation_status,
  });

  const [bannerUrl, setBannerUrl] = useState<string | null>(blog.banner_url || null);
  const [isBannerLoading, setIsBannerLoading] = useState<boolean>(false);
  const [bannerError, setBannerError] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [hasAttemptedAutoGenerate, setHasAttemptedAutoGenerate] = useState(false);

  /**
   * Generate banner image via API
   */
  const generateBanner = useCallback(async () => {
    if (bannerUrl || isBannerLoading) return;

    console.log("🎄 ChristmasPostcard: Starting image generation for", blog.id);
    setIsBannerLoading(true);
    setBannerError(false);

    try {
      const response = await fetch(`/api/hypercards/${blog.id}/image`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("🎄 ChristmasPostcard: API error", response.status, errorData);
        throw new Error(errorData.error || "Failed to generate postcard image");
      }

      const data = await response.json();
      console.log("🎄 ChristmasPostcard: Image generated successfully", data.banner_url);
      setBannerUrl(data.banner_url);
      onImageGenerated?.(data.banner_url);
    } catch (err) {
      console.error("🎄 ChristmasPostcard: Error generating image:", err);
      setBannerError(true);
    } finally {
      setIsBannerLoading(false);
    }
  }, [blog.id, bannerUrl, isBannerLoading, onImageGenerated]);

  /**
   * Auto-generate banner if we have an image prompt but no banner
   * Uses a flag to ensure we only try auto-generation once on mount
   */
  useEffect(() => {
    // Only auto-generate once on mount if conditions are met
    if (!hasAttemptedAutoGenerate && blog.image_prompt && !blog.banner_url && !bannerUrl && !isBannerLoading) {
      console.log("🎄 ChristmasPostcard: Auto-generating banner image", { 
        blogId: blog.id,
        hasPrompt: !!blog.image_prompt, 
        bannerUrl: blog.banner_url 
      });
      setHasAttemptedAutoGenerate(true);
      generateBanner();
    }
  }, [blog.id, blog.image_prompt, blog.banner_url, bannerUrl, isBannerLoading, hasAttemptedAutoGenerate, generateBanner]);

  /**
   * Download the postcard image
   */
  const handleDownload = async () => {
    if (!bannerUrl) return;

    try {
      const response = await fetch(bannerUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const sanitizedName = blog.user_query.replace(/[^a-z0-9]/gi, "_").slice(0, 50);
      a.download = `christmas-postcard-${sanitizedName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      notification.success("🎁 Postcard downloaded!");
    } catch {
      notification.error("Failed to download postcard");
    }
  };

  /**
   * Share the postcard
   */
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/hyperblogs/${blog.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Christmas Card: ${blog.user_query}`,
          text: blog.summary || blog.preview || "A magical Christmas card for you!",
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
        if ((err as Error).name !== "AbortError") {
          await copyToClipboard(shareUrl);
        }
      }
    } else {
      await copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notification.success("🎄 Link copied to clipboard!");
    } catch {
      notification.error("Failed to copy link");
    }
  };

  /**
   * Format the timestamp for postmark
   */
  const formatPostmark = (timestamp: string | number): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).toUpperCase();
    } catch {
      return "DEC 25, 2025";
    }
  };

  /**
   * Get the first section content for the postcard message
   */
  const getMessageContent = (): string => {
    if (blog.blog_content?.sections?.[0]?.content) {
      return blog.blog_content.sections[0].content;
    }
    return blog.summary || blog.preview || "Wishing you a magical Christmas! 🎄";
  };

  /**
   * Truncate address for "from" field
   */
  const truncateAddress = (address: string, chars: number = 6): string => {
    if (!address) return "Santa";
    if (address.length <= chars * 2) return address;
    return `${address.slice(0, chars)}...${address.slice(-4)}`;
  };

  return (
    <div className={`christmas-postcard-container ${className}`}>
      {/* Flip Card Container */}
      <div 
        className={`christmas-postcard ${isFlipped ? "flipped" : ""}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* FRONT SIDE - Image */}
        <div className="postcard-face postcard-front">
          <div className="postcard-inner">
            {/* Decorative corner flourishes */}
            <div className="postcard-corner postcard-corner-tl">❄</div>
            <div className="postcard-corner postcard-corner-tr">❄</div>
            <div className="postcard-corner postcard-corner-bl">❄</div>
            <div className="postcard-corner postcard-corner-br">❄</div>

            {/* Image Area */}
            <div className="postcard-image-area">
              {isBannerLoading ? (
                <div className="postcard-loading">
                  <div className="postcard-loading-content">
                    <div className="relative">
                      <span className="loading loading-spinner loading-lg text-christmas-red"></span>
                      <span className="absolute -top-1 -right-1 text-xl animate-bounce">✨</span>
                    </div>
                    <span className="text-base mt-3 text-christmas-green font-medium">
                      🎨 Creating your magical postcard...
                    </span>
                    <span className="text-xs opacity-60 mt-1">AI image generation can take 30-90 seconds</span>
                    <span className="text-xs opacity-40 mt-1">Please wait while FLUX creates your image</span>
                  </div>
                </div>
              ) : bannerUrl && !bannerError ? (
                <Image
                  src={bannerUrl}
                  alt={`Christmas Postcard: ${blog.user_query}`}
                  fill
                  className="object-cover rounded-lg"
                  onError={() => setBannerError(true)}
                  unoptimized
                />
              ) : (
                <div className="postcard-placeholder">
                  <span className="text-6xl mb-4">🎄</span>
                  <span className="text-lg font-serif text-center px-4">{blog.user_query}</span>
                  {bannerError ? (
                    <div className="flex flex-col items-center gap-2 mt-4">
                      <span className="text-sm text-error">Image generation failed</span>
                      <button
                        className="btn btn-sm btn-primary gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBannerError(false);
                          setHasAttemptedAutoGenerate(false);
                          generateBanner();
                        }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                      </button>
                    </div>
                  ) : blog.image_prompt ? (
                    <button
                      className="btn btn-sm btn-primary gap-2 mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateBanner();
                      }}
                      disabled={isBannerLoading}
                    >
                      {isBannerLoading ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          🎨 Generate Image
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-sm opacity-60 mt-4">No image prompt available</span>
                  )}
                </div>
              )}
            </div>

            {/* Caption */}
            <div className="postcard-caption">
              <span className="font-serif italic">&ldquo;{blog.user_query}&rdquo;</span>
            </div>

            {/* Flip hint */}
            <div className="postcard-flip-hint">
              Click to flip →
            </div>
          </div>
        </div>

        {/* BACK SIDE - Message */}
        <div className="postcard-face postcard-back">
          <div className="postcard-inner postcard-back-inner">
            {/* Postcard Header */}
            <div className="postcard-header">
              <span className="postcard-title font-serif">Christmas Greetings</span>
            </div>

            {/* Left Side - Message Area */}
            <div className="postcard-content">
              <div className="postcard-message-area">
                <div className="postcard-message prose prose-sm">
                  <MarkdownRenderer content={getMessageContent()} />
                </div>
              </div>

              {/* Divider Line */}
              <div className="postcard-divider"></div>

              {/* Right Side - Address & Stamp */}
              <div className="postcard-address-area">
                {/* Stamp */}
                <div className="postcard-stamp">
                  <span className="stamp-emoji">🎅</span>
                  <span className="stamp-text">NORTH POLE</span>
                  <span className="stamp-value">❄ MAGIC ❄</span>
                </div>

                {/* Postmark */}
                <div className="postcard-postmark">
                  <div className="postmark-circle">
                    <span className="postmark-text">SANTA&apos;S WORKSHOP</span>
                    <span className="postmark-date">{formatPostmark(blog.created_at)}</span>
                  </div>
                </div>

                {/* Address Lines */}
                <div className="postcard-address">
                  <div className="address-line address-to">
                    <span className="address-label">To:</span>
                    <span className="address-value">A Special Friend ✨</span>
                  </div>
                  <div className="address-line">
                    <span className="address-label">From:</span>
                    <span className="address-value">{truncateAddress(blog.author_wallet)}</span>
                  </div>
                  {blog.dataroom_description && (
                    <div className="address-line address-bonfire">
                      <span className="address-label">🔥</span>
                      <span className="address-value text-xs opacity-70">
                        {blog.dataroom_description.slice(0, 30)}
                        {blog.dataroom_description.length > 30 ? "..." : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Flip hint */}
            <div className="postcard-flip-hint">
              ← Click to flip
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="postcard-actions">
        <button
          className="btn btn-primary btn-sm gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          disabled={!bannerUrl || isBannerLoading}
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          className="btn btn-secondary btn-sm gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleShare();
          }}
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        {!bannerUrl && !isBannerLoading && blog.image_prompt && (
          <button
            className="btn btn-accent btn-sm gap-2"
            onClick={(e) => {
              e.stopPropagation();
              generateBanner();
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Generate Image
          </button>
        )}
      </div>
    </div>
  );
};

