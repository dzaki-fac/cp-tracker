/**
 * Site footer — quiet slate text on the mist surface, per the reference.
 * The data source note is generic (no platform-specific logic lives here).
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-hairline-silver bg-studio-mist">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-8 text-[12px] leading-4 text-slate sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Data sourced from the official Codeforces API. Not affiliated with
          Codeforces.
        </p>
        <p className="text-steel">
          Statistics may be cached briefly to respect API rate limits.
        </p>
      </div>
    </footer>
  );
}
