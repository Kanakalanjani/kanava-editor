/**
 * Pagination Plugin
 *
 * Decoration-based page breaks — keeps the document model clean.
 * Page breaks are `Decoration.widget` dividers; overflow blocks get
 * `Decoration.node` with a CSS class. The document JSON contains
 * zero pagination artifacts.
 *
 * The plugin recalculates on every doc change (debounced via rAF)
 * by walking the top-level `blockNode` children, measuring their
 * rendered DOM height, and inserting page breaks when accumulated
 * height exceeds the content area.
 */

import { Plugin, PluginKey, type EditorState, type Transaction } from "prosemirror-state";
import { Decoration, DecorationSet, type EditorView } from "prosemirror-view";
import type {
    PaginationConfig,
    PaginationState,
    PageBreakInfo,
} from "../api/pagination.js";
import { resolvePageDimensions } from "../api/pagination.js";

/* ── Plugin Key ────────────────────────────────────────────── */

const paginationPluginKey = new PluginKey<PaginationPluginState>("pagination");

/* ── Internal plugin state ─────────────────────────────────── */

interface PaginationPluginState {
    /** The resolved pagination state exposed to consumers. */
    pagination: PaginationState;
    /** Current decoration set. */
    decorations: DecorationSet;
    /** Set of overflow block positions (for filterTransaction). */
    overflowSet: Set<number>;
}

const EMPTY_STATE: PaginationPluginState = {
    pagination: {
        pageCount: 1,
        pageBreaks: [],
        overflowPositions: [],
        contentHeight: 0,
    },
    decorations: DecorationSet.empty,
    overflowSet: new Set(),
};

/* ── Page break widget factory ─────────────────────────────── */

function createPageBreakWidget(pageNumber: number): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "kanava-page-break";
    wrapper.contentEditable = "false";

    // Bottom edge of previous page
    const bottomEdge = document.createElement("div");
    bottomEdge.className = "kanava-page-break-edge kanava-page-break-bottom";
    wrapper.appendChild(bottomEdge);

    // Gap between pages (playground background shows through)
    const gap = document.createElement("div");
    gap.className = "kanava-page-break-gap";

    const label = document.createElement("span");
    label.className = "kanava-page-break-label";
    label.textContent = `Page ${pageNumber}`;
    gap.appendChild(label);

    wrapper.appendChild(gap);

    // Top edge of next page
    const topEdge = document.createElement("div");
    topEdge.className = "kanava-page-break-edge kanava-page-break-top";
    wrapper.appendChild(topEdge);

    return wrapper;
}

/* ── Height measurement & page-break calculation ───────────── */

function calculatePageBreaks(
    view: EditorView,
    contentHeight: number,
): { breaks: PageBreakInfo[]; overflows: number[] } {
    const doc = view.state.doc;
    const breaks: PageBreakInfo[] = [];
    const overflows: number[] = [];

    // doc → blockGroup → blockNode children
    const blockGroup = doc.firstChild;
    if (!blockGroup || blockGroup.type.name !== "blockGroup") {
        return { breaks, overflows };
    }

    // Guard: if the view has been destroyed or is not attached, bail out.
    if (!(view as any).docView) {
        return { breaks, overflows };
    }

    let accumulatedHeight = 0;
    let pageNumber = 1;

    // Walk top-level blockNode children
    blockGroup.forEach((blockNode, offset) => {
        const blockPos = 1 + offset; // +1 for the blockGroup start position

        // Measure rendered DOM height — nodeDOM can throw if the view's
        // internal node map is stale (e.g. after async rAF scheduling).
        let dom: HTMLElement | null;
        try {
            dom = view.nodeDOM(blockPos) as HTMLElement | null;
        } catch {
            return;
        }
        if (!dom) return;

        const blockHeight = dom.offsetHeight;

        // Check for forced page break (pageBreakBefore attr)
        const forceBreak = blockNode.attrs.pageBreakBefore === true;

        // Check keepWithNext for look-ahead
        const keepWithNext = blockNode.attrs.keepWithNext === true;

        // Decide if we need a page break before this block
        const wouldOverflow =
            accumulatedHeight > 0 && accumulatedHeight + blockHeight > contentHeight;

        if (forceBreak || wouldOverflow) {
            pageNumber++;
            breaks.push({ pos: blockPos, pageNumber });
            accumulatedHeight = 0;
        }

        // keepWithNext: if this block + next block would straddle a page break,
        // break BEFORE this block instead of between them
        if (keepWithNext && accumulatedHeight > 0) {
            // Look ahead at the next sibling's height
            const nextOffset = offset + blockNode.nodeSize;
            if (nextOffset < blockGroup.content.size) {
                const nextPos = 1 + nextOffset;
                const nextDom = view.nodeDOM(nextPos) as HTMLElement | null;
                if (nextDom) {
                    const nextHeight = nextDom.offsetHeight;
                    const combinedRemaining =
                        accumulatedHeight + blockHeight + nextHeight;
                    if (
                        combinedRemaining > contentHeight &&
                        accumulatedHeight + blockHeight <= contentHeight
                    ) {
                        // Current block fits, but current + next doesn't.
                        // Break before current block to keep them together.
                        pageNumber++;
                        breaks.push({ pos: blockPos, pageNumber });
                        accumulatedHeight = 0;
                    }
                }
            }
        }

        // Check for overflow (single block exceeds full page)
        if (blockHeight > contentHeight) {
            overflows.push(blockPos);
        }

        accumulatedHeight += blockHeight;
    });

    return { breaks, overflows };
}

/* ── Build decoration set ──────────────────────────────────── */

function buildDecorations(
    doc: EditorState["doc"],
    breaks: PageBreakInfo[],
    overflows: number[],
): DecorationSet {
    const decorations: Decoration[] = [];

    // Page break widgets
    for (const brk of breaks) {
        decorations.push(
            Decoration.widget(brk.pos, () => createPageBreakWidget(brk.pageNumber), {
                side: -1, // before the block
                key: `page-break-${brk.pageNumber}`,
            }),
        );
    }

    // Overflow node decorations
    for (const pos of overflows) {
        const node = doc.nodeAt(pos);
        if (node) {
            decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                    class: "kanava-overflow",
                }),
            );
        }
    }

    return DecorationSet.create(doc, decorations);
}

/* ── Plugin factory ────────────────────────────────────────── */

/**
 * Create the pagination plugin.
 *
 * @param config — Pagination configuration (page size, margins)
 * @returns ProseMirror Plugin
 *
 * @example
 * ```ts
 * paginationPlugin({ pageSize: "Letter" })
 * ```
 */
export function paginationPlugin(config: PaginationConfig): Plugin {
    let currentContentHeight = resolvePageDimensions(config).contentHeight;
    let rafHandle: number | null = null;

    return new Plugin<PaginationPluginState>({
        key: paginationPluginKey,

        state: {
            init(): PaginationPluginState {
                return {
                    ...EMPTY_STATE,
                    pagination: { ...EMPTY_STATE.pagination, contentHeight: currentContentHeight },
                };
            },

            apply(tr: Transaction, prev: PaginationPluginState): PaginationPluginState {
                // Accept state updates dispatched by the view plugin via meta
                const meta = tr.getMeta(paginationPluginKey);
                if (meta) return meta;

                // Runtime config change — update the closure contentHeight
                const configChange = tr.getMeta("paginationConfigChanged") as PaginationConfig | undefined;
                if (configChange) {
                    const dims = resolvePageDimensions(configChange);
                    currentContentHeight = dims.contentHeight;
                    return {
                        ...prev,
                        pagination: { ...prev.pagination, contentHeight: dims.contentHeight },
                    };
                }

                return prev;
            },
        },

        view(editorView: EditorView) {
            let destroyed = false;

            const recalculate = () => {
                if (destroyed || !(editorView as any).docView) {
                    return;
                }
                const { breaks, overflows } = calculatePageBreaks(
                    editorView,
                    currentContentHeight,
                );
                const decorations = buildDecorations(
                    editorView.state.doc,
                    breaks,
                    overflows,
                );

                const newPluginState: PaginationPluginState = {
                    pagination: {
                        pageCount:
                            breaks.length > 0
                                ? breaks[breaks.length - 1].pageNumber
                                : 1,
                        pageBreaks: breaks,
                        overflowPositions: overflows,
                        contentHeight: currentContentHeight,
                    },
                    decorations,
                    overflowSet: new Set(overflows),
                };
                // Dispatch a metadata-only transaction to update plugin state
                const tr = editorView.state.tr.setMeta(
                    paginationPluginKey,
                    newPluginState,
                );
                tr.setMeta("addToHistory", false);
                editorView.dispatch(tr);
            };

            const scheduleRecalc = () => {
                if (rafHandle !== null) cancelAnimationFrame(rafHandle);
                rafHandle = requestAnimationFrame(recalculate);
            };

            // Initial calculation after the view is mounted
            setTimeout(scheduleRecalc, 50);

            return {
                update(view: EditorView, prevState: EditorState) {
                    const prevPluginState = paginationPluginKey.getState(prevState);
                    const curPluginState = paginationPluginKey.getState(view.state);

                    // Recalculate on doc change OR config change (contentHeight differs)
                    const docChanged = view.state.doc !== prevState.doc;
                    const configChanged = prevPluginState?.pagination.contentHeight !== curPluginState?.pagination.contentHeight;

                    if (docChanged || configChanged) {
                        scheduleRecalc();
                    }
                },

                destroy() {
                    destroyed = true;
                    if (rafHandle !== null) cancelAnimationFrame(rafHandle);
                },
            };
        },

        props: {
            decorations(state: EditorState): DecorationSet {
                const pluginState = paginationPluginKey.getState(state);
                return pluginState?.decorations ?? DecorationSet.empty;
            },
        },

        filterTransaction(tr: Transaction, state: EditorState): boolean {
            // Allow our own metadata-only recalculation TRs
            const meta = tr.getMeta(paginationPluginKey);
            if (meta) return true;

            // Check if the transaction would add content to an overflow-locked block
            if (!tr.docChanged) return true;

            const pluginState = paginationPluginKey.getState(state);
            if (!pluginState || pluginState.overflowSet.size === 0) return true;

            // Find the blockNode ancestor of the current selection
            const { selection } = state;
            const $from = selection.$from;

            for (let d = $from.depth; d >= 0; d--) {
                if ($from.node(d).type.name === "blockNode") {
                    const blockPos = $from.before(d);
                    if (pluginState.overflowSet.has(blockPos)) {
                        // Check if the transaction is growing the block
                        // Allow deletions (they shrink the block) and selection-only changes
                        const oldSize = state.doc.nodeAt(blockPos)?.nodeSize ?? 0;
                        const newNode = tr.doc.nodeAt(tr.mapping.map(blockPos));
                        const newSize = newNode?.nodeSize ?? 0;
                        if (newSize > oldSize) {
                            // Block is growing — reject the transaction
                            return false;
                        }
                    }
                    break;
                }
            }

            return true;
        },
    });
}

/* ── Public accessors ──────────────────────────────────────── */

/**
 * Get the current pagination state from an editor state.
 * Returns `null` if the pagination plugin is not installed.
 */
export function getPaginationState(
    state: EditorState,
): PaginationState | null {
    const pluginState = paginationPluginKey.getState(state);
    return pluginState?.pagination ?? null;
}
