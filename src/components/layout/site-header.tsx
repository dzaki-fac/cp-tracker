import { RefreshButton } from "@/components/layout/refresh-button";

/**
 * Site header — a compact white bar with a product title on the left and
 * compact pill controls on the right, per the Apple product-local navigation.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-control-gray bg-gallery-white/85 backdrop-blur-[20px]">
      <div className="mx-auto flex h-13 max-w-6xl items-center justify-between px-5 sm:px-6">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[19px] leading-[1.21] font-semibold text-ink">
            CP&nbsp;Tracker
          </span>
          <span className="hidden text-[12px] leading-4 text-steel sm:inline">
            Competitive programming dashboard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <RefreshButton />
        </div>
      </div>
    </header>
  );
}
