import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet, type EditorView } from "prosemirror-view";

/**
 * Ghost Rail plugin — renders hierarchy indicators on hovered blocks.
 *
 * Architecture (correct):
 *   - Uses `Decoration.node` to add CSS classes to ancestor blocks.
 *   - `.kanava-block` has `position: relative`, so `::before` pseudo-elements
 *     on decorated blocks render correctly as children of the block wrapper.
 *   - Rail handle (clickable dot) is a persistent DOM element inside
 *     `BlockNodeView.render()`, hidden by default, shown via CSS when
 *     the `kanava-ghost-rail-active` class is present.
 *   - No DOM creation in this plugin — only class/style decoration.
 *   - No stale closures — click handling is via `handleClick` prop.
 */
export const ghostRailPluginKey = new PluginKey<GhostRailState>("ghostRail");

/** Ancestor info emitted via `kanava:ghost-rail-hover` CustomEvent. */
export interface GhostRailAncestor {
    depth: number;
    pos: number;
    typeName: string;
    label: string;
}

interface GhostRailState {
    /** ProseMirror pos of the currently hovered block, or -1 */
    hoveredPos: number;
    /** Decoration set with node decorations on ancestor blocks */
    decos: DecorationSet;
    /** Ancestor chain for the current hover (exposed for React components) */
    ancestors: GhostRailAncestor[];
}

/** Depth colors — 5 tiers, cycling. Tokens reference CSS custom properties. */
const DEPTH_CSS_VARS = [
    "var(--kanava-rail-depth-1)",
    "var(--kanava-rail-depth-2)",
    "var(--kanava-rail-depth-3)",
    "var(--kanava-rail-depth-4)",
    "var(--kanava-rail-depth-5)",
];

function depthColor(depth: number): string {
    return DEPTH_CSS_VARS[Math.min(depth, DEPTH_CSS_VARS.length - 1)];
}

/**
 * Walk from a resolved position up to the doc root, collecting
 * structurally interesting ancestors (blockNode, columnLayout, column).
 */
function buildAncestorChain(view: EditorView, pos: number) {
    const $pos = view.state.doc.resolve(pos);
    const ancestors: {
        depth: number;
        pos: number;
        end: number;
        typeName: string;
        label: string;
    }[] = [];

    let blockDepth = 0;
    for (let d = 1; d <= $pos.depth; d++) {
        const node = $pos.node(d);
        const typeName = node.type.name;

        if (
            typeName === "blockNode" ||
            typeName === "columnLayout" ||
            typeName === "column"
        ) {
            blockDepth++;

            let label = typeName;
            if (typeName === "blockNode") {
                const body = node.firstChild;
                if (body) {
                    label = body.type.name;
                    label = label.charAt(0).toUpperCase() + label.slice(1);
                }
            } else if (typeName === "columnLayout") {
                label = `${node.childCount}-Col Layout`;
            } else if (typeName === "column") {
                const parent = $pos.node(d - 1);
                let colIndex = 0;
                for (let i = 0; i < parent.childCount; i++) {
                    if (parent.child(i) === node) { colIndex = i; break; }
                }
                label = `Column ${colIndex + 1}`;
            }

            ancestors.push({
                depth: blockDepth,
                pos: $pos.before(d),
                end: $pos.after(d),
                typeName,
                label,
            });
        }
    }

    return ancestors;
}

/**
 * Create Decoration.node for each ancestor — adds CSS class + custom props.
 */
function createNodeDecorations(
    ancestors: ReturnType<typeof buildAncestorChain>
): Decoration[] {
    return ancestors.map((a) =>
        Decoration.node(a.pos, a.end, {
            class: "kanava-ghost-rail-active",
            style: `--rail-depth: ${a.depth}; --rail-color: ${depthColor(a.depth - 1)};`,
            "data-rail-depth": String(a.depth),
            "data-rail-label": a.label,
        })
    );
}

/**
 * Find the blockNode pos from a DOM event target.
 */
function findBlockPosFromDOM(view: EditorView, target: HTMLElement): number {
    let el: HTMLElement | null = target;
    while (el && el !== view.dom) {
        if (el.classList.contains("kanava-block")) {
            try {
                const pos = view.posAtDOM(el, 0);
                if (pos >= 0) {
                    const $pos = view.state.doc.resolve(pos);
                    for (let d = $pos.depth; d >= 1; d--) {
                        if ($pos.node(d).type.name === "blockNode") {
                            return $pos.before(d);
                        }
                    }
                }
            } catch {
                // posAtDOM can throw if DOM is stale
            }
            return -1;
        }
        el = el.parentElement;
    }
    return -1;
}

export function ghostRailPlugin(): Plugin<GhostRailState> {
    let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
    let clearTimeout_id: ReturnType<typeof setTimeout> | null = null;

    /** Dispatch a CustomEvent on the editor DOM with ancestor chain data. */
    function emitHoverEvent(view: EditorView, ancestors: GhostRailAncestor[]) {
        view.dom.dispatchEvent(
            new CustomEvent("kanava:ghost-rail-hover", {
                detail: { ancestors },
                bubbles: true,
            })
        );
    }

    /** Schedule a delayed clear of ghost rail decorations (300ms grace period). */
    function scheduleClear(view: EditorView) {
        if (clearTimeout_id) return; // already scheduled
        clearTimeout_id = setTimeout(() => {
            clearTimeout_id = null;
            const currentState = ghostRailPluginKey.getState(view.state);
            if (currentState && currentState.hoveredPos !== -1) {
                view.dispatch(
                    view.state.tr.setMeta(ghostRailPluginKey, {
                        hoveredPos: -1,
                        decos: DecorationSet.empty,
                        ancestors: [],
                    })
                );
                emitHoverEvent(view, []);
            }
        }, 300);
    }

    return new Plugin<GhostRailState>({
        key: ghostRailPluginKey,

        state: {
            init() {
                return { hoveredPos: -1, decos: DecorationSet.empty, ancestors: [] };
            },
            apply(tr, state) {
                const meta = tr.getMeta(ghostRailPluginKey);
                if (meta !== undefined) {
                    return meta as GhostRailState;
                }
                if (tr.docChanged) {
                    return {
                        hoveredPos: -1, // Clear on doc change — positions are stale
                        decos: DecorationSet.empty,
                        ancestors: [],
                    };
                }
                return state;
            },
        },

        props: {
            decorations(state) {
                return ghostRailPluginKey.getState(state)?.decos ?? DecorationSet.empty;
            },

            handleDOMEvents: {
                mouseover(view, event) {
                    const target = event.target as HTMLElement;

                    // Ignore rail handles and gutter layer — cursor touching
                    // these should not affect ghost rail state
                    if (target.closest(".kanava-rail-handle")) return false;
                    if (target.closest(".kanava-column-gutter-layer")) return false;
                    if (target.closest(".kanava-column-gutter")) return false;

                    // Cancel any pending clear timeout — mouse is still in the editor
                    if (clearTimeout_id) {
                        clearTimeout(clearTimeout_id);
                        clearTimeout_id = null;
                    }

                    if (hoverTimeout) clearTimeout(hoverTimeout);
                    hoverTimeout = setTimeout(() => {
                        const blockPos = findBlockPosFromDOM(view, target);
                        const currentState = ghostRailPluginKey.getState(view.state);
                        if (currentState && blockPos === currentState.hoveredPos) return;

                        if (blockPos === -1) {
                            // Cursor is in non-block area (gap, padding) but still
                            // inside the editor. DON'T clear immediately — start a
                            // grace period so user can reach rail handles.
                            scheduleClear(view);
                            return;
                        }

                        // Check if the new position is an ANCESTOR of the current hover.
                        // This happens when cursor moves leftward through padding into
                        // a parent block wrapper. In this case, keep the deeper
                        // decorations alive so rail handles don't vanish.
                        if (currentState && currentState.hoveredPos !== -1) {
                            try {
                                const $current = view.state.doc.resolve(currentState.hoveredPos);
                                // Walk up from current hover — if blockPos is an ancestor, skip
                                for (let d = $current.depth; d >= 1; d--) {
                                    if ($current.before(d) === blockPos) {
                                        // New pos is an ancestor of current — keep current state
                                        return;
                                    }
                                }
                            } catch {
                                // resolve can throw if positions are stale
                            }
                        }

                        const ancestors = buildAncestorChain(view, blockPos);

                        // Only show rails when there's actual nesting (2+ levels)
                        if (ancestors.length < 2) {
                            view.dispatch(
                                view.state.tr.setMeta(ghostRailPluginKey, {
                                    hoveredPos: blockPos,
                                    decos: DecorationSet.empty,
                                    ancestors: [],
                                })
                            );
                            emitHoverEvent(view, []);
                            return;
                        }

                        const ancestorData: GhostRailAncestor[] = ancestors.map((a) => ({
                            depth: a.depth,
                            pos: a.pos,
                            typeName: a.typeName,
                            label: a.label,
                        }));

                        const decos = createNodeDecorations(ancestors);
                        view.dispatch(
                            view.state.tr.setMeta(ghostRailPluginKey, {
                                hoveredPos: blockPos,
                                decos: DecorationSet.create(view.state.doc, decos),
                                ancestors: ancestorData,
                            })
                        );
                        emitHoverEvent(view, ancestorData);
                    }, 60);

                    return false;
                },

                mouseleave(view) {
                    if (hoverTimeout) clearTimeout(hoverTimeout);
                    // Use grace period for mouseleave too — cursor might be
                    // heading for a rail handle that's outside the editor bounds
                    scheduleClear(view);
                    return false;
                },
            },

            // Note: rail handle clicks are handled directly by BlockNodeView's
            // mousedown listener. The stopEvent() method in BlockNodeView prevents
            // ProseMirror's handleClick from reaching rail handle events.
        },
    });
}
