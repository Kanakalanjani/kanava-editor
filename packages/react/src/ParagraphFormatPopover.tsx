/**
 * ParagraphFormatPopover — multi-section popover for block-level formatting.
 *
 * Sections:
 *   • Spacing    — line height, space before/after
 *   • Indentation — first-line indent, left/right padding
 *   • Borders    — color, width, style, radius
 *   • Typography — letter spacing, text alignment
 *   • Page       — pagination controls (page-break, keep-with-next, etc.)
 */

import React, { useEffect, useRef, useState } from "react";
import type { KanavaEditor, Command } from "@kanava/editor";
import {
  setLineHeight,
  setBlockSpacing,
  setBlockPadding,
  setBlockBorder,
  setTextIndent,
  setLetterSpacing,
  setTextAlign,
  setPageBreakBefore,
  setKeepWithNext,
  setKeepLinesTogether,
  setWidowOrphan,
} from "@kanava/editor";
import type { BlockBorderAttrs } from "@kanava/editor";
import { useToolbarState } from "./hooks.js";
import { NumberStepper, SelectDropdown, SegmentedControl } from "./ToolbarPrimitives.js";
import { ColorPicker } from "./ColorPicker.js";

/* ── Props ─────────────────────────────────────────────────── */

export interface ParagraphFormatPopoverProps {
  editor: KanavaEditor | null;
  /** Element the popover is anchored below (usually the ¶ toolbar button). */
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

/* ── Constants ─────────────────────────────────────────────── */

const BORDER_STYLES = [
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "dashed" },
  { label: "Dotted", value: "dotted" },
  { label: "Double", value: "double" },
  { label: "None", value: "none" },
] as const;

const ALIGN_OPTIONS = [
  { value: "left", icon: "⬅", title: "Align left" },
  { value: "center", icon: "☰", title: "Center" },
  { value: "right", icon: "➡", title: "Align right" },
  { value: "justify", icon: "≡", title: "Justify" },
];

const BORDER_COLORS = [
  "#000000", "#444444", "#888888", "#cccccc", "#ffffff",
  "#c62828", "#e53935", "#f44336", "#ef9a9a", "#ffcdd2",
  "#1565c0", "#1e88e5", "#2196f3", "#90caf9", "#bbdefb",
  "#2e7d32", "#43a047", "#4caf50", "#a5d6a7", "#c8e6c9",
  "#f9a825", "#fdd835", "#ffee58", "#fff59d", "#fff9c4",
  "#6a1b9a", "#8e24aa", "#ce93d8", "#e1bee7", "#f3e5f5",
];

/* ── Section header ────────────────────────────────────────── */

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="kanava-pfp-section-header">{children}</div>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="kanava-pfp-row">
    <span className="kanava-pfp-row-label">{label}</span>
    <div className="kanava-pfp-row-control">{children}</div>
  </div>
);

/* ── Component ─────────────────────────────────────────────── */

export const ParagraphFormatPopover: React.FC<ParagraphFormatPopoverProps> = ({
  editor,
  anchorEl,
  onClose,
}) => {
  const toolbar = useToolbarState(editor);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<"spacing" | "indent" | "borders" | "typo" | "page">("spacing");

  const bs = toolbar?.blockStyle ?? {};

  /* ── Position below anchor ──────────────────────────────── */
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });

  useEffect(() => {
    if (!anchorEl || !popoverRef.current) return;
    const rect = anchorEl.getBoundingClientRect();
    const popW = popoverRef.current.offsetWidth || 300;
    let left = rect.left + window.scrollX;
    const rightEdge = left + popW;
    if (rightEdge > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    setStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: Math.max(8, left),
      visibility: "visible",
    });
  }, [anchorEl]);

  /* ── Close on outside click or Escape ───────────────────── */
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !(anchorEl && anchorEl.contains(e.target as Node))
      ) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown", onKey);
    };
  }, [anchorEl, onClose]);

  if (!editor) return null;

  const exec = (cmd: Command) => {
    editor.exec(cmd);
  };

  /* ── Derived values with defaults ───────────────────────── */
  const lineHeight = bs.lineHeight ?? 1.5;
  const spacingTop = bs.spacingTop ?? 0;
  const spacingBottom = bs.spacingBottom ?? 0;
  const textIndent = bs.textIndent ?? 0;
  const paddingLeft = bs.paddingLeft ?? 0;
  const paddingRight = bs.paddingRight ?? 0;
  const paddingTop = bs.paddingTop ?? 0;
  const paddingBottom = bs.paddingBottom ?? 0;
  const borderColor = bs.borderColor ?? "#000000";
  const borderWidth = bs.borderWidth ?? 0;
  const borderStyle = bs.borderStyle ?? "solid";
  const borderRadius = bs.borderRadius ?? 0;
  const letterSpacing = bs.letterSpacing ?? 0;
  const textAlign = bs.textAlign ?? "left";
  const pageBreakBefore = bs.pageBreakBefore ?? false;
  const keepWithNext = bs.keepWithNext ?? false;
  const keepLinesTogether = bs.keepLinesTogether ?? false;
  const widowOrphan = bs.widowOrphan ?? 2;

  const setBorder = (partial: Partial<BlockBorderAttrs>) => {
    exec(setBlockBorder({
      borderColor,
      borderWidth,
      borderStyle: borderStyle as BlockBorderAttrs["borderStyle"],
      borderRadius,
      ...partial,
    } as BlockBorderAttrs));
  };

  const TABS = [
    { id: "spacing", label: "Spacing" },
    { id: "indent", label: "Indent" },
    { id: "borders", label: "Borders" },
    { id: "typo", label: "Typography" },
    { id: "page", label: "Page" },
  ] as const;

  return (
    <div ref={popoverRef} className="kanava-paragraph-format-popover" style={style}>
      {/* Tab bar */}
      <div className="kanava-pfp-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={"kanava-pfp-tab" + (activeSection === tab.id ? " kanava-pfp-tab-active" : "")}
            onMouseDown={(e) => { e.preventDefault(); setActiveSection(tab.id); }}
          >{tab.label}</button>
        ))}
      </div>

      <div className="kanava-pfp-body">
        {/* ── Spacing ── */}
        {activeSection === "spacing" && (
          <div className="kanava-pfp-section">
            <Row label="Line height">
              <NumberStepper
                value={lineHeight}
                onChange={(v) => exec(setLineHeight(v))}
                min={0.5} max={5} step={0.1}
              />
            </Row>
            <Row label="Space before (px)">
              <NumberStepper
                value={spacingTop}
                onChange={(v) => exec(setBlockSpacing(v, spacingBottom))}
                min={0} max={200} step={1} suffix="px"
              />
            </Row>
            <Row label="Space after (px)">
              <NumberStepper
                value={spacingBottom}
                onChange={(v) => exec(setBlockSpacing(spacingTop, v))}
                min={0} max={200} step={1} suffix="px"
              />
            </Row>
          </div>
        )}

        {/* ── Indentation ── */}
        {activeSection === "indent" && (
          <div className="kanava-pfp-section">
            <Row label="First line (px)">
              <NumberStepper
                value={textIndent}
                onChange={(v) => exec(setTextIndent(v))}
                min={0} max={200} step={1} suffix="px"
              />
            </Row>
            <Row label="Left padding (px)">
              <NumberStepper
                value={paddingLeft}
                onChange={(v) => exec(setBlockPadding("left", v))}
                min={0} max={200} step={1} suffix="px"
              />
            </Row>
            <Row label="Right padding (px)">
              <NumberStepper
                value={paddingRight}
                onChange={(v) => exec(setBlockPadding("right", v))}
                min={0} max={200} step={1} suffix="px"
              />
            </Row>
            <Row label="Top padding (px)">
              <NumberStepper
                value={paddingTop}
                onChange={(v) => exec(setBlockPadding("top", v))}
                min={0} max={200} step={1} suffix="px"
              />
            </Row>
            <Row label="Bottom padding (px)">
              <NumberStepper
                value={paddingBottom}
                onChange={(v) => exec(setBlockPadding("bottom", v))}
                min={0} max={200} step={1} suffix="px"
              />
            </Row>
          </div>
        )}

        {/* ── Borders ── */}
        {activeSection === "borders" && (
          <div className="kanava-pfp-section">
            <Row label="Border width (px)">
              <NumberStepper
                value={borderWidth}
                onChange={(v) => setBorder({ borderWidth: v })}
                min={0} max={20} step={1} suffix="px"
              />
            </Row>
            <Row label="Border style">
              <SelectDropdown
                value={borderStyle}
                options={BORDER_STYLES as unknown as { label: string; value: string }[]}
                onChange={(v) => setBorder({ borderStyle: v as BlockBorderAttrs["borderStyle"] })}
                width={120}
              />
            </Row>
            <Row label="Border radius (px)">
              <NumberStepper
                value={borderRadius}
                onChange={(v) => setBorder({ borderRadius: v })}
                min={0} max={100} step={1} suffix="px"
              />
            </Row>
            <Row label="Border color">
              <div onMouseDown={(e) => e.preventDefault()}>
                <ColorPicker
                  value={borderColor}
                  onChange={(c) => setBorder({ borderColor: c || "#000000" })}
                  presets={BORDER_COLORS}
                  label="Border color"
                />
              </div>
            </Row>
          </div>
        )}

        {/* ── Typography ── */}
        {activeSection === "typo" && (
          <div className="kanava-pfp-section">
            <Row label="Letter spacing (px)">
              <NumberStepper
                value={letterSpacing}
                onChange={(v) => exec(setLetterSpacing(v))}
                min={-5} max={20} step={0.5} suffix="px"
              />
            </Row>
            <Row label="Text alignment">
              <SegmentedControl
                value={textAlign as string}
                options={ALIGN_OPTIONS}
                onChange={(v) => exec(setTextAlign(v as "left" | "center" | "right" | "justify"))}
              />
            </Row>
          </div>
        )}

        {/* ── Page ── */}
        {activeSection === "page" && (
          <div className="kanava-pfp-section">
            <Row label="Page break before">
              <input
                type="checkbox"
                checked={pageBreakBefore}
                onChange={(e) => exec(setPageBreakBefore(e.target.checked))}
              />
            </Row>
            <Row label="Keep with next">
              <input
                type="checkbox"
                checked={keepWithNext}
                onChange={(e) => exec(setKeepWithNext(e.target.checked))}
              />
            </Row>
            <Row label="Keep lines together">
              <input
                type="checkbox"
                checked={keepLinesTogether}
                onChange={(e) => exec(setKeepLinesTogether(e.target.checked))}
              />
            </Row>
            <Row label="Widow/orphan lines">
              <NumberStepper
                value={widowOrphan}
                onChange={(v) => exec(setWidowOrphan(v))}
                min={0} max={10} step={1}
              />
            </Row>
          </div>
        )}
      </div>
    </div>
  );
};

ParagraphFormatPopover.displayName = "ParagraphFormatPopover";
