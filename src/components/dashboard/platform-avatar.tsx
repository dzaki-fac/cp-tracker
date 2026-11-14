"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Avatar with graceful degradation: platforms' avatar CDNs can be flaky or
 * blocked, so a quiet letter tile is shown when the image cannot load.
 * The completeness check also catches failures that happened before
 * hydration, when no error listener was attached yet.
 */
export function PlatformAvatar({
  src,
  handle,
  className,
}: {
  src: string | null;
  handle: string;
  className?: string;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  useEffect(() => {
    const image = imageRef.current;
    if (image && image.complete && image.naturalWidth === 0) {
      setFailed(true);
    }
  }, [src]);

  return (
    <div
      className={cn(
        "relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-[20px] bg-studio-mist ring-1 ring-hairline-silver",
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imageRef}
          src={src}
          alt={`${handle} avatar`}
          width={96}
          height={96}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span
          aria-label={`${handle} avatar`}
          role="img"
          className="font-display text-[36px] font-semibold text-slate"
        >
          {handle.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
