/**
 * Floating format bar — appears on text selection or node selection.
 * @see packages/docs/architecture-toolbar.md
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import type { KanavaEditor } from "@kanava/editor";
import {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrike,
  toggleCode,
  toggleLink,
  setDividerAttrs,
  NodeSelection,
} from "@kanava/editor";
import { useToolbarState } from "./hooks.js";
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  BlockToolbar,
} from "./ToolbarPrimitives.js";
import { LinkIcon, CheckIcon, CloseIcon } from "./icons/index.js";
import { ImageEditorModal } from "./ImageEditorModal.js";
import { ColorPicker } from "./ColorPicker.js";

/* ------------------------------------------------------------------ */
/*  FormatBar (slim floating bar)                                      */
/* ------------------------------------------------------------------ */

export interface FormatBarProps {
  editor: KanavaEditor | null;
  className?: string;
}

/**
 * Slim floating format bar — appears on text selections and block node-selects.
 *
 * **Text mode:** Quick-access B/I/U/S/<> + link (all other controls are in FixedToolbar).
 * **Block mode:** Renders toolbar items from the selected block's `BlockDefinition.toolbar`.
 *
 * Consumes `useToolbarState()` for reactive mark/block detection.
 */
export const FormatBar: React.FC<FormatBarProps> = ({ editor, className }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [dividerColorOpen, setDividerColorOpen] = useState(false);

  // Toolbar state from the core plugin
  const toolbarState = useToolbarState(editor);

  // Close link dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setLinkOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Positioning ──────────────────────────────────────────
  const updatePosition = useCallback(() => {
    if (!editor) return;
    const view = editor.pmView;
    const { selection } = view.state;

    // Determine the reference rect — the positioned ancestor that the
    // absolutely-positioned bar is offset from.  Fall back to view.dom.
    const getRefRect = (): DOMRect => {
      const offsetParent = barRef.current?.offsetParent as HTMLElement | null;
      if (offsetParent) return offsetParent.getBoundingClientRect();
      const container = view.dom.closest(".kanava-editor-container") as HTMLElement | null;
      if (container?.parentElement) return container.parentElement.getBoundingClientRect();
      return view.dom.getBoundingClientRect();
    };

    // Block toolbar mode (image, divider, etc.)
    if (selection instanceof NodeSelection) {
      const dom = view.nodeDOM(selection.from) as HTMLElement | null;
      if (dom) {
        const refRect = getRefRect();
        const nodeRect = dom.getBoundingClientRect();
        const barWidth = barRef.current?.offsetWidth || 360;
        const barHeight = barRef.current?.offsetHeight || 40;
        const centerX = nodeRect.left + nodeRect.width / 2 - refRect.left;
        let left = centerX - barWidth / 2;
        left = Math.max(0, Math.min(left, refRect.width - barWidth));
        // Smart position: prefer above, flip below if not enough space
        let top = nodeRect.top - refRect.top - barHeight - 8;
        if (nodeRect.top - barHeight - 8 < 0) {
          top = nodeRect.bottom - refRect.top + 8;
        }
        setPosition({ top: Math.max(0, top), left });
        setVisible(true);
      }
      return;
    }

    // Text selection mode
    const { from, to, empty } = selection;
    if (empty) {
      setVisible(false);
      return;
    }

    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);
    const refRect = getRefRect();
    const barWidth = barRef.current?.offsetWidth || 400;
    const barHeight = barRef.current?.offsetHeight || 40;
    const selectionCenterX = (start.left + end.left) / 2;
    let left = selectionCenterX - refRect.left - barWidth / 2;
    left = Math.max(0, Math.min(left, refRect.width - barWidth));
    // Smart position: prefer above, flip below if not enough space
    let top = start.top - refRect.top - barHeight - 8;
    if (start.top - barHeight - 8 < 0) {
      top = end.bottom - refRect.top + 8;
    }
    setPosition({ top: Math.max(0, top), left });
    setVisible(true);
  }, [editor]);

  // Re-position on selection change
  useEffect(() => {
    if (!editor) return;
    const unsub = editor.on("selectionChange", () => {
      requestAnimationFrame(updatePosition);
    });
    return unsub;
  }, [editor, updatePosition]);

  // Also update on mouse/key up
  useEffect(() => {
    if (!editor) return;
    const dom = editor.pmView.dom;
    const handler = () => requestAnimationFrame(updatePosition);
    dom.addEventListener("mouseup", handler);
    dom.addEventListener("keyup", handler);
    return () => {
      dom.removeEventListener("mouseup", handler);
      dom.removeEventListener("keyup", handler);
    };
  }, [editor, updatePosition]);

  // ── Command helpers ──────────────────────────────────────
  const execCmd = useCallback(
    (cmd: any) => {
      if (!editor) return;
      editor.exec(cmd);
      editor.focus();
    },
    [editor],
  );

  // ── Link ─────────────────────────────────────────────────

  /** Extract the href from an existing link mark at the selection. */
  const getExistingLinkHref = useCallback((): string => {
    if (!editor) return "";
    const { $from } = editor.pmView.state.selection;
    const marks = $from.marks();
    for (const m of marks) {
      if (m.type.name === "link" && m.attrs.href) return m.attrs.href as string;
    }
    return "";
  }, [editor]);

  const applyLink = () => {
    if (!editor) return;
    if (linkUrl.trim()) {
      execCmd(toggleLink(editor.schema, { href: linkUrl.trim() }));
    }
    setLinkOpen(false);
    setLinkUrl("");
  };

  const removeExistingLink = () => {
    if (!editor) return;
    execCmd(toggleLink(editor.schema));
    setLinkOpen(false);
  };

  // ── Render guard ─────────────────────────────────────────
  if (!editor || !toolbarState) return null;

  // Always render the bar DOM so it can animate in/out.
  // The `visible` flag controls the CSS animation class.
  const activeMarks = toolbarState.activeMarks;
  const hasBlockToolbar = toolbarState.blockToolbarItems.length > 0;

  /* ================================================================ */
  /*  Block toolbar mode                                               */
  /*  Shown when a block with toolbar items is node-selected           */
  /* ================================================================ */
  if (toolbarState.isNodeSelection && hasBlockToolbar) {
    // Intercept the "image-edit" toolbar button to emit the imageEdit event.
    const emitImageEdit = () => {
      if (!editor) return;
      const { selection } = editor.pmView.state;
      if (selection instanceof NodeSelection && selection.node.type.name === "image") {
        editor.emit("imageEdit", {
          pos: selection.from,
          attrs: { ...selection.node.attrs },
        });
      }
    };

    // Get current divider color for the color picker
    const getDividerColor = (): string => {
      if (!editor) return "";
      const { selection } = editor.pmView.state;
      if (selection instanceof NodeSelection) {
        const node = selection.node;
        if (node.type.name === "blockNode") {
          const child = node.firstChild;
          if (child?.type.name === "divider") return child.attrs.color || "";
        }
        if (node.type.name === "divider") return node.attrs.color || "";
      }
      return "";
    };

    return (
      <>
        <div
          ref={barRef}
          className={`kanava-format-bar kanava-format-bar-block ${visible ? "kanava-format-bar-visible" : ""} ${className || ""}`}
          role="toolbar"
          aria-label="Block formatting"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).tagName !== "INPUT") e.preventDefault();
          }}
        >
          <BlockToolbar
            items={toolbarState.blockToolbarItems}
            editor={editor}
            onCustomAction={(key) => {
              if (key === "image-edit") emitImageEdit();
              if (key === "divider-color") setDividerColorOpen((v) => !v);
            }}
          />
          {dividerColorOpen && (
            <div className="kanava-fb-dropdown kanava-fb-divider-color-picker" onMouseDown={(e) => e.preventDefault()}>
              <ColorPicker
                value={getDividerColor()}
                onChange={(c) => {
                  editor.exec(setDividerAttrs({ color: c || null }));
                  editor.focus();
                }}
                label="Divider color"
              />
            </div>
          )}
        </div>
        <ImageEditorModal editor={editor} />
      </>
    );
  }

  /* ================================================================ */
  /*  Text formatting mode                                             */
  /*  Shown when a text range is selected                              */
  /* ================================================================ */
  return (
    <div
      ref={barRef}
      className={`kanava-format-bar ${visible ? "kanava-format-bar-visible" : ""} ${className || ""}`}
      role="toolbar"
      aria-label="Text formatting"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Text formatting */}
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
        label={"<>"}
        title="Inline Code (Ctrl+E)"
        active={activeMarks.has("code")}
        aria-pressed={activeMarks.has("code")}
        command={toggleCode(editor.schema)}
        editor={editor}
      />

      <ToolbarSeparator />

      {/* Link */}
      <ToolbarGroup>
        <ToolbarButton
          label={<LinkIcon size={14} />}
          title="Link"
          active={activeMarks.has("link")}
          aria-pressed={activeMarks.has("link")}
          onClick={() => { setLinkOpen((v) => !v); if (!linkOpen) { setLinkUrl(getExistingLinkHref()); setTimeout(() => linkInputRef.current?.focus(), 50); } }}
        />
        {linkOpen && (
          <div className="kanava-fb-dropdown kanava-fb-link-dropdown">
            <input
              ref={linkInputRef}
              className="kanava-fb-link-input"
              type="text"
              placeholder="Paste URL..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyLink();
                if (e.key === "Escape") { setLinkOpen(false); editor.focus(); }
              }}
            />
            <button className="kanava-fb-link-apply" onClick={applyLink} type="button"><CheckIcon size={14} /></button>
            {activeMarks.has("link") && (
              <button className="kanava-fb-link-remove" onClick={removeExistingLink} type="button"><CloseIcon size={14} /></button>
            )}
          </div>
        )}
      </ToolbarGroup>
    </div>
  );
};

FormatBar.displayName = "KanavaFormatBar";
