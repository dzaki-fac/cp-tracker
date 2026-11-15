"use client";

import { useMemo, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Search,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hint } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRankColor } from "@/lib/cf-rank";
import { DISPLAY_TIMEZONE } from "@/lib/config";
import { distinctRatings, distinctTags } from "@/lib/statistics";
import { cn, formatNumber } from "@/lib/utils";
import type { SolvedProblem } from "@/types/platform";

const PAGE_SIZES = [25, 50, 100];

type SortKey = "date" | "rating";
type SortDir = "asc" | "desc";

/** Consistent with the server-side day bucketing timezone (Asia/Jakarta). */
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: DISPLAY_TIMEZONE,
});

function formatDate(unixSeconds: number): string {
  return DATE_FORMAT.format(new Date(unixSeconds * 1000));
}

/** Label for the contest column: contest name when known, "Gym" for gyms. */
function contestLabel(
  problem: SolvedProblem,
  contestNames: Record<number, string>,
): string | null {
  if (problem.contestId == null) return null;
  if (problem.contestId >= 100000) return "Gym";
  return contestNames[problem.contestId] ?? `Contest ${problem.contestId}`;
}

function contestHref(problem: SolvedProblem): string | null {
  if (problem.contestId == null) return null;
  return problem.contestId >= 100000
    ? `https://codeforces.com/gym/${problem.contestId}`
    : `https://codeforces.com/contest/${problem.contestId}`;
}

interface SolvedProblemsTableProps {
  problems: SolvedProblem[];
  /** contestId → contest name (best effort; "Contest {id}" as fallback). */
  contestNames?: Record<number, string>;
  /** Controlled tag selection (union filter), shared with the tag breakdown. */
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

/**
 * Searchable, filterable, sortable, paginated list of unique solved problems.
 * Deduplication happens server-side; every row is one unique problem.
 */
export function SolvedProblemsTable({
  problems,
  contestNames = {},
  selectedTags = [],
  onTagsChange,
}: SolvedProblemsTableProps) {
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const ratings = useMemo(() => distinctRatings(problems), [problems]);
  const tags = useMemo(() => distinctTags(problems), [problems]);

  const toggleTag = (tag: string) => {
    onTagsChange(
      selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag],
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (ratingFilter !== "all" && String(p.rating ?? "unrated") !== ratingFilter)
        return false;
      if (
        selectedTags.length > 0 &&
        !selectedTags.some((tag) => p.tags.includes(tag))
      )
        return false;
      return true;
    });
  }, [problems, query, ratingFilter, selectedTags]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "rating") {
        const ra = a.rating ?? -1;
        const rb = b.rating ?? -1;
        if (ra !== rb) return (ra - rb) * dir;
        return (a.firstSolvedAt - b.firstSolvedAt) * dir;
      }
      return (a.firstSolvedAt - b.firstSolvedAt) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const resetPage = () => setPage(1);

  const isEmptyAll = problems.length === 0;

  return (
    <Card className="flex flex-col gap-5 p-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-4 text-steel" aria-hidden />
          Solved problems
        </CardTitle>
        <CardDescription className="numeric">
          {formatNumber(problems.length)} unique problem
          {problems.length === 1 ? "" : "s"} solved all-time
        </CardDescription>
      </CardHeader>

      {isEmptyAll ? (
        <div className="flex h-32 items-center justify-center text-[14px] text-steel">
          No solved problems yet.
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative sm:w-64">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-steel"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetPage();
                }}
                placeholder="Search by problem name"
                className="pl-9"
                aria-label="Search problems by name"
              />
            </div>

            <Select
              value={ratingFilter}
              onValueChange={(v) => {
                setRatingFilter(v);
                resetPage();
              }}
            >
              <SelectTrigger className="sm:w-40" aria-label="Filter by rating">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ratings</SelectItem>
                {ratings.map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {formatNumber(r)}
                  </SelectItem>
                ))}
                {problems.some((p) => p.rating == null) ? (
                  <SelectItem value="unrated">Unrated</SelectItem>
                ) : null}
              </SelectContent>
            </Select>

            {/* Tag multi-select popover */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="flex h-9 items-center justify-between gap-2 rounded-pill border border-steel bg-gallery-white px-3.5 text-[13px] leading-[1.2] text-ink transition-colors outline-none hover:border-slate data-[state=open]:border-apple-blue focus-visible:border-apple-blue focus-visible:ring-2 focus-visible:ring-apple-blue/25 sm:w-52"
                  aria-label="Filter by tag"
                >
                  <span className="truncate">
                    {selectedTags.length === 0
                      ? "All tags"
                      : `${formatNumber(selectedTags.length)} tag${
                          selectedTags.length === 1 ? "" : "s"
                        }`}
                  </span>
                  <ChevronDown className="size-3.5 shrink-0 text-steel" aria-hidden />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={6}
                  align="start"
                  className="z-50 max-h-72 w-64 overflow-y-auto overscroll-contain rounded-[14px] border border-hairline-silver bg-gallery-white p-1 shadow-[0_12px_40px_rgb(0_0_0/0.12)]"
                >
                  {tags.map(({ tag, count }) => (
                    <DropdownMenu.CheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => toggleTag(tag)}
                      onSelect={(event) => event.preventDefault()}
                      className="relative flex cursor-default select-none items-center gap-2 rounded-[8px] py-1.5 pl-8 pr-3 text-[13px] leading-[1.2] text-ink outline-none transition-colors data-[highlighted]:bg-studio-mist"
                    >
                      <span className="absolute left-2.5 flex items-center">
                        <DropdownMenu.ItemIndicator>
                          <Check
                            className="size-3.5 text-pricing-blue"
                            aria-hidden
                          />
                        </DropdownMenu.ItemIndicator>
                      </span>
                      <span className="flex-1 truncate">{tag}</span>
                      <span className="numeric text-[12px] text-steel">
                        {formatNumber(count)}
                      </span>
                    </DropdownMenu.CheckboxItem>
                  ))}
                  {selectedTags.length > 0 ? (
                    <>
                      <DropdownMenu.Separator className="my-1 h-px bg-hairline-silver" />
                      <DropdownMenu.Item
                        onSelect={() => onTagsChange([])}
                        className="flex cursor-default select-none items-center gap-2 rounded-[8px] px-3 py-1.5 text-[13px] leading-[1.2] text-slate outline-none transition-colors data-[highlighted]:bg-studio-mist"
                      >
                        <X className="size-3.5" aria-hidden />
                        Clear tag filter
                      </DropdownMenu.Item>
                    </>
                  ) : null}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* Table */}
          {rows.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-[14px] text-steel">
              No problems match your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-56">Problem</TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => toggleSort("rating")}
                      className="inline-flex items-center gap-1 transition-colors hover:text-ink"
                      aria-label="Sort by rating"
                    >
                      Rating
                      {sortKey === "rating" ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="size-3" aria-hidden />
                        ) : (
                          <ArrowDown className="size-3" aria-hidden />
                        )
                      ) : null}
                    </button>
                  </TableHead>
                  <TableHead className="min-w-40">Tags</TableHead>
                  <TableHead className="min-w-36">Contest</TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort("date")}
                      className="inline-flex items-center gap-1 transition-colors hover:text-ink"
                      aria-label="Sort by date first solved"
                    >
                      Date solved
                      {sortKey === "date" ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="size-3" aria-hidden />
                        ) : (
                          <ArrowDown className="size-3" aria-hidden />
                        )
                      ) : null}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => {
                  const label = contestLabel(p, contestNames);
                  const href = contestHref(p);
                  return (
                    <TableRow key={p.key}>
                      <TableCell className="max-w-72">
                        {p.url ? (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${p.name} on Codeforces`}
                            className="block max-w-full truncate text-apple-blue hover:underline underline-offset-2"
                          >
                            {p.name}
                          </a>
                        ) : (
                          <span className="block truncate">{p.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="w-20 text-right">
                        {p.rating != null ? (
                          <span
                            className="numeric font-medium"
                            style={{ color: getRankColor(p.rating) }}
                          >
                            {formatNumber(p.rating)}
                          </span>
                        ) : (
                          <span className="text-steel">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-52">
                        <div className="flex flex-wrap gap-1">
                          {p.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="default"
                              className="max-w-40 truncate"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {p.tags.length > 3 ? (
                            <Hint content={p.tags.slice(3).join(", ")}>
                              <span
                                tabIndex={0}
                                className="numeric self-center cursor-help rounded-[4px] text-[12px] text-steel outline-none focus-visible:ring-2 focus-visible:ring-apple-blue/40"
                              >
                                +{p.tags.length - 3}
                              </span>
                            </Hint>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-44">
                        {label && href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open contest ${label} on Codeforces`}
                            className="block max-w-full truncate text-slate hover:text-apple-blue hover:underline underline-offset-2"
                          >
                            {label}
                          </a>
                        ) : (
                          <span className="text-steel">—</span>
                        )}
                      </TableCell>
                      <TableCell className="numeric w-32">
                        {formatDate(p.firstSolvedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!isEmptyAll && sorted.length > 0 ? (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="numeric text-[12px] leading-4 text-slate">
                Showing {formatNumber(start + 1)}–
                {formatNumber(Math.min(start + pageSize, sorted.length))} of{" "}
                {formatNumber(sorted.length)}
                {sorted.length !== problems.length
                  ? ` (of ${formatNumber(problems.length)} total)`
                  : ""}
              </p>
              <div className="flex items-center gap-3">
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    resetPage();
                  }}
                >
                  <SelectTrigger className="w-[7.5rem]" aria-label="Rows per page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-3.5" aria-hidden />
                  </Button>
                  <span
                    className={cn(
                      "numeric min-w-24 text-center text-[12px] leading-4 text-slate",
                    )}
                  >
                    Page {safePage} of {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={safePage >= pageCount}
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}
