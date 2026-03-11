import React, { useEffect, useState, useCallback, useRef } from "react";
import type { KanavaEditor } from "@kanava/editor";
import {
  deleteCurrentBlock,
  duplicateBlock,
  insertBlockAfter,
  convertBlockType,
  createColumnLayout,
  addColumnLeft,
  addColumnRight,
} from "@kanava/editor";
import { useToolbarState } from "./hooks.js";
import {
  TrashIcon, DuplicateIcon, TurnIntoIcon, ColumnsIcon, Columns3Icon, Columns4Icon,
  AddColumnLeftIcon, AddColumnRightIcon, InsertBelowIcon, ChevronRightIcon,
} from "./icons/index.js";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MenuEntry {
  label: string;
  icon: React.ReactNode;
  action?: () => void;
  shortcut?: string;
  divider?: boolean;
  disabled?: boolean;
  /** If present, this entry opens a submenu instead of acting directly. */
  children?: MenuEntry[];
}

export interface ContextMenuProps {
  editor: KanavaEditor | null;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Submenu item renderer                                              */
/* ------------------------------------------------------------------ */

const MenuItemButton: React.FC<{
  entry: MenuEntry;
  onHover: (label: string | null) => void;
  openSubmenu: string | null;
}> = ({ entry, onHover, openSubmenu }) => {
  const hasChildren = entry.children && entry.children.length > 0;
  const isOpen = openSubmenu === entry.label;

  return (
    <div
      className="kanava-ctx-item-wrap"
      onMouseEnter={() => onHover(hasChildren ? entry.label : null)}
      onMouseLeave={() => {
        /* leave handled by parent */
      }}
    >
      <button
        className={`kanava-ctx-item ${entry.disabled ? "disabled" : ""} ${hasChildren ? "has-submenu" : ""}`}
        onClick={entry.disabled ? undefined : hasChildren ? undefined : entry.action}
        disabled={entry.disabled}
        type="button"
        role="menuitem"
        aria-haspopup={hasChildren ? "true" : undefined}
        aria-expanded={hasChildren ? isOpen : undefined}
      >
        <span className="kanava-ctx-icon">{entry.icon}</span>
        <span className="kanava-ctx-label">{entry.label}</span>
        {entry.shortcut && (
          <span className="kanava-ctx-shortcut">{entry.shortcut}</span>
        )}
        {hasChildren && <span className="kanava-ctx-caret"><ChevronRightIcon size={12} /></span>}
      </button>

      {/* Submenu */}
      {hasChildren && isOpen && (
        <div className="kanava-ctx-submenu" role="menu">
          {entry.children!.map((child, j) => (
            <React.Fragment key={j}>
              <button
                className={`kanava-ctx-item ${child.disabled ? "disabled" : ""}`}
                onClick={child.disabled ? undefined : child.action}
                disabled={child.disabled}
                type="button"
                role="menuitem"
              >
                <span className="kanava-ctx-icon">{child.icon}</span>
                <span className="kanava-ctx-label">{child.label}</span>
                {child.shortcut && (
                  <span className="kanava-ctx-shortcut">{child.shortcut}</span>
                )}
              </button>
              {child.divider && <div className="kanava-ctx-divider" />}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  ContextMenu                                                        */
/* ------------------------------------------------------------------ */

/**
 * Right-click context menu for block operations.
 *
 * Organised into a compact, Notion-style layout with submenus for
 * "Turn into" (block type conversions) and "Columns" (column operations).
 *
 * Includes block-specific items from `BlockDefinition.contextMenu`.
 * Consumes `useToolbarState()` for block-specific items.
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({
  editor,
  className,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [inColumn, setInColumn] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const toolbarState = useToolbarState(editor);
  const blockType = toolbarState?.selectedBlockType ?? "paragraph";

  const closeMenu = useCallback(() => {
    setVisible(false);
    setOpenSubmenu(null);
  }, []);

  // Close on click outside or Escape
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu]);

  // Listen for contextmenu event on the editor
  useEffect(() => {
    if (!editor) return;

    const dom = editor.pmView.dom;
    const handler = (e: Event) => {
      const me = e as MouseEvent;
      me.preventDefault();

      // Detect if inside a column
      const state = editor.pmState;
      const { $from } = state.selection;
      let isInColumn = false;
      for (let d = $from.depth; d >= 0; d--) {
        if ($from.node(d).type.name === "column") {
          isInColumn = true;
          break;
        }
      }
      setInColumn(isInColumn);

      // Position relative to the editor container
      const editorContainer =
        dom.closest(".kanava-editor-container") || dom.parentElement!;
      const containerRect = editorContainer.getBoundingClientRect();
      let top = me.clientY - containerRect.top;
      let left = me.clientX - containerRect.left;

      // Clamp to viewport
      const menuHeight = 280;
      const menuWidth = 220;
      if (top + menuHeight > containerRect.height) {
        top = Math.max(0, top - menuHeight);
      }
      if (left + menuWidth > containerRect.width) {
        left = Math.max(0, left - menuWidth);
      }

      setPosition({ top, left });
      setOpenSubmenu(null);
      setVisible(true);
    };

    dom.addEventListener("contextmenu", handler);
    return () => dom.removeEventListener("contextmenu", handler);
  }, [editor]);

  const runCmd = useCallback(
    (cmd: any) => {
      if (!editor) return;
      editor.exec(cmd);
      editor.focus();
      closeMenu();
    },
    [editor, closeMenu],
  );

  if (!visible || !editor) return null;

  // ── Build "Turn into" submenu (derived from editor.blockDefs) ────
  const turnIntoChildren: MenuEntry[] = [];
  for (const def of editor.blockDefs) {
    if (!def.convertible) continue;
    if (Array.isArray(def.convertible)) {
      for (const variant of def.convertible) {
        const isActive =
          blockType === def.name &&
          Object.entries(variant.attrs).every(
            ([k, v]) => toolbarState?.selectedBlockNode?.attrs?.[k] === v,
          );
        turnIntoChildren.push({
          label: variant.label,
          icon: variant.icon,
          action: () => runCmd(convertBlockType(def.name, variant.attrs)),
          disabled: isActive,
          divider: variant.divider,
        });
      }
    } else {
      turnIntoChildren.push({
        label: def.label || def.name,
        icon: def.icon || <span>¶</span>,
        action: () => runCmd(convertBlockType(def.name)),
        disabled: blockType === def.name,
      });
    }
  }

  // ── Build "Columns" submenu ──────────────────────────
  const columnsChildren: MenuEntry[] = [
    {
      label: "2 columns",
      icon: <ColumnsIcon size={14} />,
      action: () => runCmd(createColumnLayout(2)),
    },
    {
      label: "3 columns",
      icon: <Columns3Icon size={14} />,
      action: () => runCmd(createColumnLayout(3)),
    },
    {
      label: "4 columns",
      icon: <Columns4Icon size={14} />,
      action: () => runCmd(createColumnLayout(4)),
    },
  ];

  // When inside a column, add directional options
  if (inColumn) {
    columnsChildren.push(
      { label: "", icon: null, action: undefined, divider: true },
      {
        label: "Add column left",
        icon: <AddColumnLeftIcon size={14} />,
        action: () => runCmd(addColumnLeft),
      },
      {
        label: "Add column right",
        icon: <AddColumnRightIcon size={14} />,
        action: () => runCmd(addColumnRight),
      },
    );
  }

  // ── Build top-level entries ──────────────────────────
  const entries: MenuEntry[] = [
    {
      label: "Delete",
      icon: <TrashIcon size={14} />,
      action: () => runCmd(deleteCurrentBlock),
      shortcut: "Del",
    },
    {
      label: "Duplicate",
      icon: <DuplicateIcon size={14} />,
      action: () => runCmd(duplicateBlock),
      shortcut: "Ctrl+D",
      divider: true,
    },
    {
      label: "Turn into",
      icon: <TurnIntoIcon size={14} />,
      children: turnIntoChildren,
    },
    {
      label: "Columns",
      icon: <ColumnsIcon size={14} />,
      children: columnsChildren,
      divider: true,
    },
    {
      label: "Insert below",
      icon: <InsertBelowIcon size={14} />,
      action: () => runCmd(insertBlockAfter("paragraph")),
    },
  ];

  // ── Block-specific context menu items from BlockDefinition ──
  const defItems = toolbarState?.contextMenuItems ?? [];
  if (defItems.length > 0) {
    // Add a divider before block-specific items
    if (entries.length > 0) {
      entries[entries.length - 1].divider = true;
    }
    for (const item of defItems) {
      const isEnabled = item.isEnabled
        ? item.isEnabled(editor.pmState)
        : true;
      entries.push({
        label: item.label,
        icon: item.icon || "•",
        action: () => runCmd(item.command),
        disabled: !isEnabled,
      });
    }
  }

  return (
    <div
      ref={menuRef}
      className={`kanava-context-menu ${className || ""}`}
      role="menu"
      aria-label="Block actions"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseLeave={() => setOpenSubmenu(null)}
    >
      {entries.map((entry, i) => (
        <React.Fragment key={i}>
          <MenuItemButton
            entry={entry}
            onHover={setOpenSubmenu}
            openSubmenu={openSubmenu}
          />
          {entry.divider && <div className="kanava-ctx-divider" />}
        </React.Fragment>
      ))}
    </div>
  );
};

ContextMenu.displayName = "KanavaContextMenu";
