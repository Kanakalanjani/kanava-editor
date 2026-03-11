/**
 * FixedToolbar — primary Word-style toolbar, always visible above the editor.
 *
 * Contains: Block type | Font family | Font size | B I U S <> | Sup Sub |
 *           Text color | Highlight | Alignment | Link | ¶ (paragraph format)
 */

import React, { useRef, useMemo, useState, useCallback } from "react";
import type { KanavaEditor, BlockDefinition, Command } from "@kanava/editor";
import {
  convertBlockType,
  setTextAlign,
  setTextColor,
  removeTextColor,
  setHighlight,
  removeHighlight,
  setBlockBackground,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrike,
  toggleCode,
  toggleLink,
  toggleSuperscript,
  toggleSubscript,
  setFontSize,
  setFontFamily,
  undo,
  redo,
} from "@kanava/editor";
import { useToolbarState } from "./hooks.js";
import {
  ToolbarButton,
  ToolbarSeparator,
  ToolbarGroup,
  SelectDropdown,
  SegmentedControl,
} from "./ToolbarPrimitives.js";
import {
  UndoIcon, RedoIcon, LinkIcon, ParagraphIcon, ChevronDownIcon,
  AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon,
} from "./icons/index.js";
import { ParagraphFormatPopover } from "./ParagraphFormatPopover.js";
import { ColorPicker } from "./ColorPicker.js";

/* ── Block type helpers ────────────────────────────────────── */

interface BlockTypeEntry {
  label: string;
  value: string;
  icon: string;
  attrs?: Record<string, unknown>;
}

function buildConvertibleBlockTypes(blockDefs: readonly BlockDefinition[]): BlockTypeEntry[] {
  const entries: BlockTypeEntry[] = [];
  for (const def of blockDefs) {
    if (!def.convertible) continue;
    if (Array.isArray(def.convertible)) {
      for (const variant of def.convertible) {
        entries.push({ label: variant.label, value: def.name, icon: variant.icon, attrs: variant.attrs });
      }
    } else {
      entries.push({ label: def.label || def.name, value: def.name, icon: def.icon || "¶" });
    }
  }
  return entries;
}

/* ── Color palettes (defaults) ──────────────────────────────── */

export interface FontOption {
  label: string;
  value: string;
}

const DEFAULT_TEXT_COLORS: string[] = [
  "", "#e74c3c", "#e67e22", "#f1c40f", "#27ae60",
  "#2980b9", "#8e44ad", "#e91e8c", "#7f8c8d",
];

const DEFAULT_HIGHLIGHT_COLORS: string[] = [
  "", "#ffeaa7", "#b8f0c0", "#bee3f8", "#e2d6f3",
  "#fdd", "#fdebd0", "#fadbd8", "#e8e8e8",
];

/* ── Font options (defaults) ────────────────────────────────── */

const DEFAULT_FONT_FAMILIES: FontOption[] = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
  { label: "Impact", value: "Impact, sans-serif" },
];

const FONT_SIZES = [
  "8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "72",
].map((s) => ({ label: s, value: `${s}px` }));

const ALIGN_OPTIONS = [
  { value: "left", icon: <AlignLeftIcon size={14} />, title: "Align left" },
  { value: "center", icon: <AlignCenterIcon size={14} />, title: "Center" },
  { value: "right", icon: <AlignRightIcon size={14} />, title: "Align right" },
  { value: "justify", icon: <AlignJustifyIcon size={14} />, title: "Justify" },
];

/* ── Props ─────────────────────────────────────────────────── */

export interface FixedToolbarProps {
  editor: KanavaEditor | null;
  className?: string;
  /** Custom text color presets (hex strings). Falls back to built-in palette. */
  textColorPresets?: string[];
  /** Custom highlight color presets (hex strings). Falls back to built-in palette. */
  highlightColorPresets?: string[];
  /** Custom font family options. Falls back to built-in list. */
  fontFamilies?: FontOption[];
}

/* ── Component ─────────────────────────────────────────────── */

export const FixedToolbar: React.FC<FixedToolbarProps> = ({
  editor,
  className,
  textColorPresets = DEFAULT_TEXT_COLORS,
  highlightColorPresets = DEFAULT_HIGHLIGHT_COLORS,
  fontFamilies = DEFAULT_FONT_FAMILIES,
}) => {
  const toolbarState = useToolbarState(editor);
  const paraButtonRef = useRef<HTMLButtonElement>(null);
  const [paraOpen, setParaOpen] = useState(false);

  // Dropdowns
  const [blockTypeOpen, setBlockTypeOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [bgColorOpen, setBgColorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);

  const blockTypes = useMemo(
    () => (editor ? buildConvertibleBlockTypes(editor.blockDefs) : []),
    [editor],
  );

  const exec = useCallback(
    (cmd: Command) => {
      if (!editor) return;
      editor.exec(cmd);
      editor.focus();
    },
    [editor],
  );

  if (!editor) return null;

  const activeMarks = toolbarState?.activeMarks ?? new Set<string>();
  const blockType = toolbarState?.selectedBlockType ?? "paragraph";
  const blockStyle = toolbarState?.blockStyle;
  const textAlign = blockStyle?.textAlign ?? "left";

  const currentBlock = blockTypes.find(
    (b) =>
      b.value === blockType &&
      (!b.attrs?.level ||
        toolbarState?.selectedBlockNode?.attrs?.level === b.attrs.level),
  );

  // Resolve active font size from toolbar state (stored as "14px")
  const activeFontSize = toolbarState?.activeFontSize ?? null;
  const activeFontFamily = toolbarState?.activeFontFamily ?? null;

  const applyLink = () => {
    if (linkUrl.trim()) exec(toggleLink(editor.schema, { href: linkUrl.trim() }));
    setLinkOpen(false);
    setLinkUrl("");
  };

  const removeExistingLink = () => {
    exec(toggleLink(editor.schema));
    setLinkOpen(false);
  };

  return (
    <div className={`kanava-fixed-toolbar ${className || ""}`}
      role="toolbar"
      aria-label="Editor formatting"
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).tagName !== "INPUT") e.preventDefault();
      }}
    >
      {/* ── Undo / Redo ── */}
      <ToolbarButton
        label={<UndoIcon size={14} />}
        title="Undo (Ctrl+Z)"
        command={undo}
        editor={editor}
      />
      <ToolbarButton
        label={<RedoIcon size={14} />}
        title="Redo (Ctrl+Y)"
        command={redo}
        editor={editor}
      />

      <ToolbarSeparator />

      {/* ── Block type ── */}
      <ToolbarGroup>
        <div className="kanava-ft-block-type">
          <button
            className="kanava-fb-btn kanava-ft-bt-trigger"
            onClick={() => setBlockTypeOpen((v) => !v)}
            title="Block type"
            type="button"
          >
            {currentBlock?.icon || <ParagraphIcon size={14} />}
            <span className="kanava-fb-caret"><ChevronDownIcon size={10} /></span>
          </button>
          {blockTypeOpen && (
            <div className="kanava-fb-dropdown kanava-fb-dropdown-left kanava-ft-bt-menu">
              {blockTypes.map((bt) => (
                <button
                  key={bt.value + (bt.attrs?.level || "")}
                  className={"kanava-fb-dropdown-item" + (
                    bt.value === blockType &&
                    (!bt.attrs?.level || toolbarState?.selectedBlockNode?.attrs?.level === bt.attrs.level)
                      ? " active" : ""
                  )}
                  onClick={() => {
                    exec(convertBlockType(bt.value, bt.attrs as Record<string, unknown> | undefined));
                    setBlockTypeOpen(false);
                  }}
                  type="button"
                >
                  <span className="kanava-fb-dropdown-icon">{bt.icon}</span>
                  {bt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* ── Font family ── */}
      <SelectDropdown
        value={activeFontFamily}
        options={fontFamilies}
        onChange={(v) => {
          if (!v) return;
          exec(setFontFamily(editor.schema, v));
        }}
        placeholder="Font"
        width={120}
      />

      {/* ── Font size ── */}
      <SelectDropdown
        value={activeFontSize}
        options={FONT_SIZES}
        onChange={(v) => exec(setFontSize(editor.schema, v))}
        placeholder="Size"
        width={64}
      />

      <ToolbarSeparator />

      {/* ── Text formatting ── */}
      <ToolbarButton
        label={<strong>B</strong>}
        title="Bold (Ctrl+B)"
        active={activeMarks.has("bold")}
        aria-pressed={activeMarks.has("bold")}
        command={toggleBold(editor.schema)}
        editor={editor}
      />
      <ToolbarButton
        label={<em>I</em>}
        title="Italic (Ctrl+I)"
        active={activeMarks.has("italic")}
        aria-pressed={activeMarks.has("italic")}
        command={toggleItalic(editor.schema)}
        editor={editor}
      />
      <ToolbarButton
        label={<u>U</u>}
        title="Underline (Ctrl+U)"
        active={activeMarks.has("underline")}
        aria-pressed={activeMarks.has("underline")}
        command={toggleUnderline(editor.schema)}
        editor={editor}
      />
      <ToolbarButton
        label={<s>S</s>}
        title="Strikethrough"
        active={activeMarks.has("strike")}
        aria-pressed={activeMarks.has("strike")}
        command={toggleStrike(editor.schema)}
        editor={editor}
      />
      <ToolbarButton
        label="<>"
        title="Inline code"
        active={activeMarks.has("code")}
        aria-pressed={activeMarks.has("code")}
        command={toggleCode(editor.schema)}
        editor={editor}
      />

      <ToolbarSeparator />

      {/* ── Superscript / Subscript ── */}
      <ToolbarButton
        label="X²"
        title="Superscript (Ctrl+Shift+.)"
        active={activeMarks.has("superscript")}
        aria-pressed={activeMarks.has("superscript")}
        command={toggleSuperscript(editor.schema)}
        editor={editor}
      />
      <ToolbarButton
        label="X₂"
        title="Subscript (Ctrl+Shift+,)"
        active={activeMarks.has("subscript")}
        aria-pressed={activeMarks.has("subscript")}
        command={toggleSubscript(editor.schema)}
        editor={editor}
      />

      <ToolbarSeparator />

      {/* ── Text color ── */}
      <ToolbarGroup>
        <button
          className="kanava-fb-btn kanava-ft-color-btn"
          onClick={() => { setTextColorOpen((v) => !v); setHighlightOpen(false); setBgColorOpen(false); }}
          title="Text color"
          type="button"
        >A▾</button>
        {textColorOpen && (
          <div className="kanava-fb-dropdown kanava-fb-color-picker" onMouseDown={(e) => e.preventDefault()}>
            <ColorPicker
              value=""
              onChange={(c) => {
                if (!c) exec(removeTextColor(editor.schema));
                else exec(setTextColor(editor.schema, c));
              }}
              presets={textColorPresets}
              label="Text color"
            />
          </div>
        )}
      </ToolbarGroup>

      {/* ── Highlight ── */}
      <ToolbarGroup>
        <button
          className="kanava-fb-btn kanava-ft-highlight-btn"
          onClick={() => { setHighlightOpen((v) => !v); setTextColorOpen(false); setBgColorOpen(false); }}
          title="Highlight"
          type="button"
        >H▾</button>
        {highlightOpen && (
          <div className="kanava-fb-dropdown kanava-fb-color-picker" onMouseDown={(e) => e.preventDefault()}>
            <ColorPicker
              value=""
              onChange={(c) => {
                if (!c) exec(removeHighlight(editor.schema));
                else exec(setHighlight(editor.schema, c));
              }}
              presets={highlightColorPresets}
              label="Highlight color"
            />
          </div>
        )}
      </ToolbarGroup>

      {/* ── Block background color ── */}
      <ToolbarGroup>
        <button
          className={"kanava-fb-btn kanava-ft-bg-btn" + (blockStyle?.backgroundColor ? " active" : "")}
          onClick={() => { setBgColorOpen((v) => !v); setTextColorOpen(false); setHighlightOpen(false); }}
          title="Block background color"
          type="button"
          style={blockStyle?.backgroundColor ? { borderBottom: `3px solid ${blockStyle.backgroundColor}` } : undefined}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/>
            <rect x="8" y="4" width="14" height="16" rx="2" fill={blockStyle?.backgroundColor || "none"} />
          </svg>
        </button>
        {bgColorOpen && (
          <div className="kanava-fb-dropdown kanava-fb-bg-picker" onMouseDown={(e) => e.preventDefault()}>
            <ColorPicker
              value={blockStyle?.backgroundColor || ""}
              onChange={(c) => {
                exec(setBlockBackground(c || null));
              }}
              label="Background"
            />
          </div>
        )}
      </ToolbarGroup>

      <ToolbarSeparator />
      <SegmentedControl
        value={textAlign as string}
        options={ALIGN_OPTIONS}
        onChange={(v) => exec(setTextAlign(v as "left" | "center" | "right" | "justify"))}
      />

      <ToolbarSeparator />

      {/* ── Link ── */}
      <ToolbarGroup>
        <ToolbarButton
          label={<LinkIcon size={14} />}
          title="Insert / edit link"
          active={activeMarks.has("link")}
          aria-pressed={activeMarks.has("link")}
          onClick={() => { setLinkOpen((v) => !v); }}
          editor={editor}
        />
        {linkOpen && (
          <div className="kanava-fb-dropdown kanava-fb-link-popup">
            <input
              className="kanava-fb-link-input"
              type="url"
              placeholder="Paste URL…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyLink(); }}
              autoFocus
            />
            <div className="kanava-fb-link-actions">
              <button className="kanava-fb-btn" onClick={applyLink} type="button">Apply</button>
              {activeMarks.has("link") && (
                <button className="kanava-fb-btn kanava-fb-btn-danger" onClick={removeExistingLink} type="button">
                  Remove
                </button>
              )}
            </div>
          </div>
        )}
      </ToolbarGroup>

      <ToolbarSeparator />

      {/* ── Paragraph format popover ── */}
      <button
        ref={paraButtonRef}
        className={"kanava-fb-btn" + (paraOpen ? " active" : "")}
        title="Paragraph formatting"
        type="button"
        onClick={() => setParaOpen((v) => !v)}
      ><ParagraphIcon size={14} /></button>

      {paraOpen && (
        <ParagraphFormatPopover
          editor={editor}
          anchorEl={paraButtonRef.current}
          onClose={() => setParaOpen(false)}
        />
      )}
    </div>
  );
};

FixedToolbar.displayName = "FixedToolbar";
