/**
 * Pagination types, configuration, and page-size presets.
 *
 * This module is the public API surface for pagination configuration.
 * The actual pagination logic lives in `plugins/pagination.ts`.
 */

/* ── Page-size presets ─────────────────────────────────────── */

/**
 * Standard page size presets.
 * Dimensions are in CSS px at 96 DPI (browser default).
 */
export const PageSizePresets = {
    /** ISO A4 — 210 × 297 mm */
    A4: { width: 794, height: 1123 },
    /** US Letter — 8.5 × 11 in */
    Letter: { width: 816, height: 1056 },
    /** US Legal — 8.5 × 14 in */
    Legal: { width: 816, height: 1344 },
} as const;

export type PageSizeName = keyof typeof PageSizePresets;

/* ── Margins ───────────────────────────────────────────────── */

/** Page margins in CSS px. */
export interface PageMargins {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/** Default page margins (matching Word/Docs "Normal" preset). */
export const DEFAULT_PAGE_MARGINS: PageMargins = {
    top: 72,
    right: 96,
    bottom: 72,
    left: 96,
};

/* ── Configuration ─────────────────────────────────────────── */

/**
 * Pagination configuration passed to `KanavaEditorOptions.pagination`.
 *
 * @example
 * ```ts
 * const editor = new KanavaEditor({
 *   mode: "paginated",
 *   pagination: {
 *     pageSize: "A4",
 *     margins: { top: 72, right: 96, bottom: 72, left: 96 },
 *   },
 * });
 * ```
 */
export interface PaginationConfig {
    /**
     * Page size — a preset name (`"A4"`, `"Letter"`, `"Legal"`) or
     * custom dimensions `{ width, height }` in CSS px.
     */
    pageSize: PageSizeName | { width: number; height: number };

    /**
     * Page margins in CSS px.
     * Defaults to `DEFAULT_PAGE_MARGINS` if omitted.
     */
    margins?: PageMargins;
}

/* ── Runtime state ─────────────────────────────────────────── */

/** Describes a single page break inserted by the pagination plugin. */
export interface PageBreakInfo {
    /** Document position just before the page break decoration. */
    pos: number;
    /** 1-indexed page number of the page that starts after this break. */
    pageNumber: number;
}

/**
 * Snapshot of the current pagination state.
 * Computed by the pagination plugin on every document change.
 */
export interface PaginationState {
    /** Total number of pages. */
    pageCount: number;
    /** Page break positions, sorted by position. */
    pageBreaks: PageBreakInfo[];
    /** Positions of blocks whose rendered height exceeds one full content area. */
    overflowPositions: number[];
    /** Resolved content-area height (page height − top margin − bottom margin). */
    contentHeight: number;
}

/* ── Helpers ───────────────────────────────────────────────── */

/**
 * Generate a `@page` CSS string for print/PDF export.
 *
 * Converts the pagination config into CSS px dimensions.
 * Use with `react-to-print`'s `pageStyle` prop or inject into a `<style>` tag.
 *
 * @example
 * ```ts
 * const css = getPageStyleCSS({ pageSize: "Letter", margins: { top: 54, bottom: 54, left: 54, right: 54 } });
 * // => "@page { size: 816px 1056px; margin: 54px 54px 54px 54px; }"
 * ```
 */
export function getPageStyleCSS(config: PaginationConfig): string {
    const { width, height, margins } = resolvePageDimensions(config);
    return `@page { size: ${width}px ${height}px; margin: ${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px; }`;
}

/**
 * Resolve a `PaginationConfig` into concrete pixel dimensions.
 */
export function resolvePageDimensions(config: PaginationConfig): {
    width: number;
    height: number;
    margins: PageMargins;
    contentHeight: number;
} {
    const dims =
        typeof config.pageSize === "string"
            ? PageSizePresets[config.pageSize]
            : config.pageSize;

    const margins = config.margins ?? DEFAULT_PAGE_MARGINS;
    const contentHeight = dims.height - margins.top - margins.bottom;

    return { width: dims.width, height: dims.height, margins, contentHeight };
}
