/**
 * Commands for the Find & Replace plugin.
 * Each command dispatches meta to findReplaceKey.
 */
import type { Command } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import { findReplaceKey, getFindReplaceState } from "../plugins/findReplace.js";
import type { FindReplaceMeta } from "../plugins/findReplace.js";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function dispatchMeta(meta: FindReplaceMeta): Command {
  return (state, dispatch) => {
    if (dispatch) {
      const tr = state.tr.setMeta(findReplaceKey, meta);
      dispatch(tr);
    }
    return true;
  };
}

/* ------------------------------------------------------------------ */
/*  Public commands                                                     */
/* ------------------------------------------------------------------ */

/** Open the find bar. Pre-fills query from current text selection. */
export function openFindReplace(): Command {
  return (state, dispatch) => {
    if (dispatch) {
      const tr = state.tr.setMeta(findReplaceKey, {
        type: "open",
      } as FindReplaceMeta);
      dispatch(tr);
    }
    return true;
  };
}

/** Close the find bar and clear all highlights. */
export function closeFindReplace(): Command {
  return dispatchMeta({ type: "close" });
}

/** Update the search query, recomputing matches. */
export function setSearchQuery(query: string): Command {
  return dispatchMeta({ type: "setQuery", query });
}

/** Update the replacement text. */
export function setReplaceText(text: string): Command {
  return dispatchMeta({ type: "setReplaceText", replaceText: text });
}

/** Navigate to the next match and scroll it into view. */
export function findNext(): Command {
  return (state, dispatch) => {
    const frState = getFindReplaceState(state);
    if (!frState || frState.matches.length === 0) return false;
    if (!dispatch) return true;

    const newIndex = (frState.currentIndex + 1) % frState.matches.length;
    const match = frState.matches[newIndex];
    const tr = state.tr
      .setSelection(TextSelection.create(state.doc, match.from, match.to))
      .scrollIntoView()
      .setMeta(findReplaceKey, { type: "setIndex", index: newIndex } as FindReplaceMeta);
    dispatch(tr);
    return true;
  };
}

/** Navigate to the previous match and scroll it into view. */
export function findPrev(): Command {
  return (state, dispatch) => {
    const frState = getFindReplaceState(state);
    if (!frState || frState.matches.length === 0) return false;
    if (!dispatch) return true;

    const newIndex =
      (frState.currentIndex - 1 + frState.matches.length) %
      frState.matches.length;
    const match = frState.matches[newIndex];
    const tr = state.tr
      .setSelection(TextSelection.create(state.doc, match.from, match.to))
      .scrollIntoView()
      .setMeta(findReplaceKey, { type: "setIndex", index: newIndex } as FindReplaceMeta);
    dispatch(tr);
    return true;
  };
}

/** Replace the current match with the replacement text, then advance. */
export function replaceCurrent(): Command {
  return (state, dispatch) => {
    const frState = getFindReplaceState(state);
    if (!frState || frState.currentIndex < 0) return false;
    const match = frState.matches[frState.currentIndex];
    if (!match) return false;
    if (!dispatch) return true;

    const tr = state.tr.replaceWith(
      match.from,
      match.to,
      frState.replaceText ? state.schema.text(frState.replaceText) : [],
    );
    dispatch(tr);
    return true;
  };
}

/** Replace all matches with the replacement text. */
export function replaceAll(): Command {
  return (state, dispatch) => {
    const frState = getFindReplaceState(state);
    if (!frState || frState.matches.length === 0) return false;
    if (!dispatch) return true;

    // Apply replacements from end to start to preserve positions
    let tr = state.tr;
    const replaceContent = frState.replaceText
      ? state.schema.text(frState.replaceText)
      : null;

    for (let i = frState.matches.length - 1; i >= 0; i--) {
      const m = frState.matches[i];
      if (replaceContent) {
        tr = tr.replaceWith(m.from, m.to, replaceContent);
      } else {
        tr = tr.delete(m.from, m.to);
      }
    }
    dispatch(tr);
    return true;
  };
}

/** Toggle case-sensitive search. */
export function toggleCaseSensitive(): Command {
  return dispatchMeta({ type: "toggleCaseSensitive" });
}

/** Toggle regex search. */
export function toggleRegex(): Command {
  return dispatchMeta({ type: "toggleRegex" });
}

/** Toggle whole-word search. */
export function toggleWholeWord(): Command {
  return dispatchMeta({ type: "toggleWholeWord" });
}
