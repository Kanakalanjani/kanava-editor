/**
 * FindReplaceBar — VS Code-style floating find & replace bar.
 *
 * Usage:
 *   <FindReplaceBar editor={editor} />
 *
 * Positioned absolutely at the top-right of the editor container.
 * Keyboard: Ctrl+F opens (via keymap), Escape closes, Enter = next,
 * Shift+Enter = prev.
 */
import React, { useCallback, useEffect, useRef } from "react";
import type { KanavaEditor } from "@kanava/editor";
import "./find-replace.css";
import {
  setSearchQuery,
  setReplaceText,
  findNext,
  findPrev,
  replaceCurrent,
  replaceAll,
  closeFindReplace,
  toggleCaseSensitive,
  toggleRegex,
  toggleWholeWord,
} from "@kanava/editor";
import { useFindReplaceState } from "./hooks.js";
import {
  SearchIcon,
  ReplaceIcon,
  ChevronDownIcon,
  CloseIcon,
} from "./icons/index.js";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface FindReplaceBarProps {
  editor: KanavaEditor | null;
  /** Additional CSS class on the root element */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function FindReplaceBar({ editor, className }: FindReplaceBarProps) {
  const state = useFindReplaceState(editor);
  const findInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [showReplace, setShowReplace] = React.useState(false);

  // Auto-focus find input when the bar opens
  useEffect(() => {
    if (state?.isOpen) {
      // Delay focus slightly so ProseMirror doesn't steal it back
      const id = requestAnimationFrame(() => findInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [state?.isOpen]);

  const exec = useCallback(
    (cmd: ReturnType<typeof findNext>) => {
      if (editor) editor.exec(cmd);
    },
    [editor],
  );

  const handleFindKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        exec(closeFindReplace());
        editor?.focus();
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        exec(findPrev());
      } else if (e.key === "Enter") {
        e.preventDefault();
        exec(findNext());
      }
    },
    [exec, editor],
  );

  const handleReplaceKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        exec(closeFindReplace());
        editor?.focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        exec(replaceCurrent());
      }
    },
    [exec, editor],
  );

  if (!state?.isOpen) return null;

  const { query, replaceText: rText, matches, currentIndex, caseSensitive, useRegex: isRegex, wholeWord } = state;
  const matchLabel =
    matches.length === 0
      ? query
        ? "No results"
        : ""
      : `${currentIndex + 1} of ${matches.length}`;

  return (
    <div
      className={`kanava-find-replace-bar${className ? ` ${className}` : ""}`}
      role="search"
      aria-label="Find and Replace"
    >
      {/* Expand/collapse replace toggle */}
      <button
        className="kanava-fr-toggle"
        onClick={() => setShowReplace((v) => !v)}
        aria-expanded={showReplace}
        aria-label={showReplace ? "Hide replace" : "Show replace"}
        title={showReplace ? "Hide replace" : "Show replace"}
      >
        <ChevronDownIcon
          size={14}
          className={showReplace ? "kanava-fr-chevron-open" : "kanava-fr-chevron-closed"}
        />
      </button>

      <div className="kanava-fr-fields">
        {/* ── Find row ── */}
        <div className="kanava-fr-row">
          <div className="kanava-fr-input-wrap">
            <SearchIcon size={14} className="kanava-fr-input-icon" />
            <input
              ref={findInputRef}
              className="kanava-fr-input"
              type="text"
              placeholder="Find"
              value={query}
              onChange={(e) => exec(setSearchQuery(e.target.value))}
              onKeyDown={handleFindKeyDown}
              aria-label="Find"
            />
            <span className="kanava-fr-match-count" aria-live="polite">
              {matchLabel}
            </span>
          </div>

          {/* Option toggles */}
          <button
            className={`kanava-fr-option${caseSensitive ? " kanava-fr-option--active" : ""}`}
            onClick={() => exec(toggleCaseSensitive())}
            title="Match Case"
            aria-pressed={caseSensitive}
          >
            Aa
          </button>
          <button
            className={`kanava-fr-option${wholeWord ? " kanava-fr-option--active" : ""}`}
            onClick={() => exec(toggleWholeWord())}
            title="Match Whole Word"
            aria-pressed={wholeWord}
          >
            <span style={{ textDecoration: "underline", fontWeight: 500 }}>ab</span>
          </button>
          <button
            className={`kanava-fr-option${isRegex ? " kanava-fr-option--active" : ""}`}
            onClick={() => exec(toggleRegex())}
            title="Use Regular Expression"
            aria-pressed={isRegex}
          >
            .*
          </button>

          {/* Nav */}
          <button
            className="kanava-fr-btn"
            onClick={() => exec(findPrev())}
            disabled={matches.length === 0}
            title="Previous Match (Shift+Enter)"
            aria-label="Previous match"
          >
            &#x2191;
          </button>
          <button
            className="kanava-fr-btn"
            onClick={() => exec(findNext())}
            disabled={matches.length === 0}
            title="Next Match (Enter)"
            aria-label="Next match"
          >
            &#x2193;
          </button>

          {/* Close */}
          <button
            className="kanava-fr-btn kanava-fr-close"
            onClick={() => {
              exec(closeFindReplace());
              editor?.focus();
            }}
            title="Close (Escape)"
            aria-label="Close"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* ── Replace row ── */}
        {showReplace && (
          <div className="kanava-fr-row">
            <div className="kanava-fr-input-wrap">
              <ReplaceIcon size={14} className="kanava-fr-input-icon" />
              <input
                ref={replaceInputRef}
                className="kanava-fr-input"
                type="text"
                placeholder="Replace"
                value={rText}
                onChange={(e) => exec(setReplaceText(e.target.value))}
                onKeyDown={handleReplaceKeyDown}
                aria-label="Replace"
              />
            </div>
            <button
              className="kanava-fr-btn"
              onClick={() => exec(replaceCurrent())}
              disabled={matches.length === 0}
              title="Replace (Enter in replace field)"
              aria-label="Replace"
            >
              Replace
            </button>
            <button
              className="kanava-fr-btn"
              onClick={() => exec(replaceAll())}
              disabled={matches.length === 0}
              title="Replace All"
              aria-label="Replace all"
            >
              All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
