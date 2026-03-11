/**
 * Find & Replace plugin — VS Code-style search with regex/case/word support.
 * Highlights matches via decorations, tracks current match index.
 *
 * React integration via useSyncExternalStore:
 *   subscribe = subscribeFindReplace(editorState, listener)
 *   getSnapshot = getFindReplaceState(editorState)
 *
 * Commands in commands/findReplace.ts dispatch meta to this plugin.
 */
import { Plugin, PluginKey } from "prosemirror-state";
import type { EditorState, Transaction } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { Decoration, DecorationSet } from "prosemirror-view";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface FindReplaceMatch {
  from: number;
  to: number;
}

export interface FindReplaceState {
  /** Whether the find bar is open */
  isOpen: boolean;
  /** Search query */
  query: string;
  /** Replacement text */
  replaceText: string;
  /** Case-sensitive search */
  caseSensitive: boolean;
  /** Use regular expression */
  useRegex: boolean;
  /** Match whole words only */
  wholeWord: boolean;
  /** All matches found */
  matches: readonly FindReplaceMatch[];
  /** Index of the currently highlighted match (-1 if none) */
  currentIndex: number;
}

const EMPTY_STATE: FindReplaceState = {
  isOpen: false,
  query: "",
  replaceText: "",
  caseSensitive: false,
  useRegex: false,
  wholeWord: false,
  matches: [],
  currentIndex: -1,
};

/* ------------------------------------------------------------------ */
/*  Meta actions                                                        */
/* ------------------------------------------------------------------ */

export type FindReplaceMeta =
  | { type: "open" }
  | { type: "close" }
  | { type: "setQuery"; query: string }
  | { type: "setReplaceText"; replaceText: string }
  | { type: "toggleCaseSensitive" }
  | { type: "toggleRegex" }
  | { type: "toggleWholeWord" }
  | { type: "findNext" }
  | { type: "findPrev" }
  | { type: "setIndex"; index: number };

/* ------------------------------------------------------------------ */
/*  Plugin key                                                          */
/* ------------------------------------------------------------------ */

interface FindReplacePluginData {
  state: FindReplaceState;
  prevState: FindReplaceState | null;
  listeners: Set<() => void>;
}

export const findReplaceKey = new PluginKey<FindReplacePluginData>(
  "findReplace",
);

/* ------------------------------------------------------------------ */
/*  Match computation                                                   */
/* ------------------------------------------------------------------ */

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function computeMatches(
  doc: EditorState["doc"],
  query: string,
  opts: Pick<FindReplaceState, "caseSensitive" | "useRegex" | "wholeWord">,
): FindReplaceMatch[] {
  if (!query) return [];

  let pattern: string;
  if (opts.useRegex) {
    // Validate the regex — if invalid, return no matches
    try {
      new RegExp(query);
      pattern = query;
    } catch {
      return [];
    }
  } else {
    pattern = escapeRegex(query);
  }

  if (opts.wholeWord) {
    pattern = `\\b${pattern}\\b`;
  }

  const flags = opts.caseSensitive ? "g" : "gi";
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch {
    return [];
  }

  // Extract text content from the document and find matches
  const matches: FindReplaceMatch[] = [];
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      let m: RegExpExecArray | null;
      regex.lastIndex = 0;
      while ((m = regex.exec(node.text)) !== null) {
        if (m[0].length === 0) {
          regex.lastIndex++;
          continue;
        }
        matches.push({ from: pos + m.index, to: pos + m.index + m[0].length });
      }
    }
  });

  return matches;
}

/** Find the nearest match index at or after `pos`. */
function findNearestIndex(matches: readonly FindReplaceMatch[], pos: number): number {
  if (matches.length === 0) return -1;
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].from >= pos) return i;
  }
  return 0; // wrap to first
}

/* ------------------------------------------------------------------ */
/*  Decorations                                                         */
/* ------------------------------------------------------------------ */

function buildDecorations(
  doc: EditorState["doc"],
  matches: readonly FindReplaceMatch[],
  currentIndex: number,
): DecorationSet {
  if (matches.length === 0) return DecorationSet.empty;

  const decos: Decoration[] = matches.map((m, i) =>
    Decoration.inline(m.from, m.to, {
      class:
        i === currentIndex
          ? "kanava-find-match kanava-find-current"
          : "kanava-find-match",
    }),
  );

  return DecorationSet.create(doc, decos);
}

/* ------------------------------------------------------------------ */
/*  Plugin factory                                                      */
/* ------------------------------------------------------------------ */

export function findReplacePlugin(): Plugin<FindReplacePluginData> {
  return new Plugin<FindReplacePluginData>({
    key: findReplaceKey,

    state: {
      init(): FindReplacePluginData {
        return {
          state: EMPTY_STATE,
          prevState: null,
          listeners: new Set(),
        };
      },

      apply(
        tr: Transaction,
        pluginState: FindReplacePluginData,
        _oldState: EditorState,
        newState: EditorState,
      ): FindReplacePluginData {
        const meta = tr.getMeta(findReplaceKey) as
          | FindReplaceMeta
          | undefined;

        let next = pluginState.state;

        if (meta) {
          switch (meta.type) {
            case "open":
              next = { ...next, isOpen: true };
              break;
            case "close":
              next = {
                ...EMPTY_STATE,
                isOpen: false,
              };
              break;
            case "setQuery": {
              const matches = computeMatches(newState.doc, meta.query, next);
              const currentIndex = findNearestIndex(matches, tr.selection.from);
              next = { ...next, query: meta.query, matches, currentIndex };
              break;
            }
            case "setReplaceText":
              next = { ...next, replaceText: meta.replaceText };
              break;
            case "toggleCaseSensitive": {
              const cs = !next.caseSensitive;
              const matches = computeMatches(newState.doc, next.query, {
                ...next,
                caseSensitive: cs,
              });
              const currentIndex = findNearestIndex(matches, tr.selection.from);
              next = { ...next, caseSensitive: cs, matches, currentIndex };
              break;
            }
            case "toggleRegex": {
              const ur = !next.useRegex;
              const matches = computeMatches(newState.doc, next.query, {
                ...next,
                useRegex: ur,
              });
              const currentIndex = findNearestIndex(matches, tr.selection.from);
              next = { ...next, useRegex: ur, matches, currentIndex };
              break;
            }
            case "toggleWholeWord": {
              const ww = !next.wholeWord;
              const matches = computeMatches(newState.doc, next.query, {
                ...next,
                wholeWord: ww,
              });
              const currentIndex = findNearestIndex(matches, tr.selection.from);
              next = { ...next, wholeWord: ww, matches, currentIndex };
              break;
            }
            case "findNext": {
              if (next.matches.length === 0) break;
              const idx = (next.currentIndex + 1) % next.matches.length;
              next = { ...next, currentIndex: idx };
              break;
            }
            case "findPrev": {
              if (next.matches.length === 0) break;
              const idx =
                (next.currentIndex - 1 + next.matches.length) %
                next.matches.length;
              next = { ...next, currentIndex: idx };
              break;
            }
            case "setIndex":
              next = { ...next, currentIndex: meta.index };
              break;
          }
        } else if (tr.docChanged && next.query) {
          // Document changed — recompute matches
          const matches = computeMatches(newState.doc, next.query, next);
          const currentIndex = Math.min(
            next.currentIndex,
            matches.length - 1,
          );
          next = { ...next, matches, currentIndex: Math.max(currentIndex, -1) };
        }

        if (next === pluginState.state) return pluginState;

        return {
          state: next,
          prevState: pluginState.state,
          listeners: pluginState.listeners,
        };
      },
    },

    props: {
      decorations(state: EditorState): DecorationSet {
        const data = findReplaceKey.getState(state);
        if (!data || !data.state.isOpen) return DecorationSet.empty;
        return buildDecorations(
          state.doc,
          data.state.matches,
          data.state.currentIndex,
        );
      },
    },

    view() {
      return {
        update(view: EditorView) {
          const data = findReplaceKey.getState(view.state);
          if (!data) return;
          if (data.state !== data.prevState) {
            data.listeners.forEach((fn) => fn());
          }
        },
      };
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Public accessors (for React hooks)                                  */
/* ------------------------------------------------------------------ */

export function getFindReplaceState(
  editorState: EditorState,
): FindReplaceState | null {
  return findReplaceKey.getState(editorState)?.state ?? null;
}

export function subscribeFindReplace(
  editorState: EditorState,
  listener: () => void,
): () => void {
  const data = findReplaceKey.getState(editorState);
  if (!data) return () => {};
  data.listeners.add(listener);
  return () => {
    data.listeners.delete(listener);
  };
}
