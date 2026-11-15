"use client";

import { useMemo, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Check,
  ChevronDown,
  Clock3,
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
import { formatNumber } from "@/lib/utils";
import type { SolvedProblem } from "@/types/platform";

/** How many recent problems are visible initially, and per "show more". */
const INITIAL_ROWS = 12;
const ROWS_STEP = 12;

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

/** "1454B" style contest + index label, "Gym" for gym contests. */
function problemSource(problem: SolvedProblem): string | null {
  if (problem.contestId == null) return null;
  const id =
    problem.contestId >= 100000 ? "Gym" : String(problem.contestId);
  return problem.index ? `${id} ${problem.index}` : id;
}

function contestHref(problem: SolvedProblem): string | null {
  if (problem.contestId == null) return null;
  return problem.contestId >= 100000
    ? `https://codeforces.com/gym/${problem.contestId}`
    : `https://codeforces.com/contest/${problem.contestId}`;
}

interface RecentSolvedProblemsProps {
  /** Unique solved problems, any order — the list sorts newest first. */
  problems: SolvedProblem[];
  /** Controlled tag selection (union filter), shared with the topic card. */
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

/**
 * Recent Solved Problems — the most recently first-solved unique problems
 * (one row per problem; duplicates across submissions are already merged
 * server-side). Defaults to the latest 12 with a "show more" control, and
 * keeps name search, rating filter and the shared tag multi-select.
 */
export function RecentSolvedProblems({
  problems,
  selectedTags = [],
  onTagsChange,
}: RecentSolvedProblemsProps) {
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_ROWS);

  const recent = useMemo(
    () =>
      [...problems]
        .sort((a, b) => b.firstSolvedAt - a.firstSolvedAt),
    [problems],
  );
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
    return recent.filter((p) => {
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
  }, [recent, query, ratingFilter, selectedTags]);

  const rows = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > rows.length;

  return (
    <Card className="flex flex-col gap-5 p-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="size-4 text-steel" aria-hidden />
          Recent solved problems
        </CardTitle>
        <CardDescription className="numeric">
          {formatNumber(problems.length)} unique problem
          {problems.length === 1 ? "" : "s"} solved all-time · newest first
        </CardDescription>
      </CardHeader>

      {problems.length === 0 ? (
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
                  setVisibleCount(INITIAL_ROWS);
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
                setVisibleCount(INITIAL_ROWS);
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

          {/* Recent problems table */}
          {rows.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-[14px] text-steel">
              No problems match your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-56">Problem</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="min-w-40">Tags</TableHead>
                  <TableHead className="min-w-24">Source</TableHead>
                  <TableHead>Date solved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => {
                  const source = problemSource(p);
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
                      <TableCell className="max-w-28">
                        {source && href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open contest ${source} on Codeforces`}
                            className="block max-w-full truncate text-slate hover:text-apple-blue hover:underline underline-offset-2"
                          >
                            {source}
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

          {/* Show more / footer */}
          {filtered.length > 0 ? (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="numeric text-[12px] leading-4 text-slate">
                Showing {formatNumber(rows.length)} of {formatNumber(filtered.length)}
                {filtered.length !== problems.length
                  ? ` (of ${formatNumber(problems.length)} total)`
                  : ""}
              </p>
              {hasMore ? (
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((count) => count + ROWS_STEP)}
                >
                  <ListChecks className="size-3.5" aria-hidden />
                  Show {formatNumber(Math.min(ROWS_STEP, filtered.length - rows.length))}{" "}
                  more
                </Button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}
