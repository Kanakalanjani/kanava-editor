import React, { useState, useRef, useEffect, useCallback } from "react";
import type { KanavaEditor, ToolbarItem, ToolbarDropdownItem, Command } from "@kanava/editor";
import { useIconResolver, ChevronDownIcon } from "./icons/index.js";

/* ------------------------------------------------------------------ */
/*  Icon resolution (context-aware)                                     */
/* ------------------------------------------------------------------ */

/** Text-only icon keys that should NOT be resolved to SVG. */
const TEXT_ICONS = new Set(["altText"]);

/**
 * Hook that returns an icon resolver for block toolbar items.
 * Uses the pluggable icon context — consumers can override via
 * KanavaIconProvider.
 */
function useResolveIcon(): (icon: string) => React.ReactNode {
  const resolver = useIconResolver();
  return useCallback(
    (icon: string): React.ReactNode => {
      if (TEXT_ICONS.has(icon)) return icon;
      return resolver(icon, { size: 14 });
    },
    [resolver],
  );
}

/* ------------------------------------------------------------------ */
/*  ToolbarButton                                                       */
/* ------------------------------------------------------------------ */

export interface ToolbarButtonProps {
  /** Text or emoji label. */
  label: React.ReactNode;
  /** Tooltip / accessible title. */
  title?: string;
  /** Whether the button is in an active/pressed state. */
  active?: boolean;
  /** Whether the button is disabled. */
  disabled?: boolean;
  /** Click handler (prefer `command` + `editor` for ProseMirror commands). */
  onClick?: () => void;
  /** ProseMirror command to execute (used with `editor`). */
  command?: Command;
  /** Editor instance for executing commands. */
  editor?: KanavaEditor | null;
  /** Extra CSS class. */
  className?: string;
  /** Whether this is a "danger" button (e.g. delete). */
  danger?: boolean;
  /** ARIA pressed state for toggle buttons. */
  "aria-pressed"?: boolean;
  /** ARIA label for icon-only buttons. */
  "aria-label"?: string;
}

/**
 * Reusable toolbar button primitive.
 * Prevents default on mousedown to keep editor focus.
 */
export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  label,
  title,
  active = false,
  disabled = false,
  onClick,
  command,
  editor,
  className = "",
  danger = false,
  "aria-pressed": ariaPressed,
  "aria-label": ariaLabel,
}) => {
  const handleClick = useCallback(() => {
    if (disabled) return;
    if (command && editor) {
      editor.exec(command);
      editor.focus();
    } else if (onClick) {
      onClick();
    }
  }, [disabled, command, editor, onClick]);

  return (
    <button
      className={`kanava-fb-btn ${active ? "active" : ""} ${danger ? "kanava-fb-btn-danger" : ""} ${className}`}
      onMouseDown={(e) => {
        // Keep editor focus for non-input elements
        if ((e.target as HTMLElement).tagName !== "INPUT") {
          e.preventDefault();
        }
      }}
      onClick={handleClick}
      disabled={disabled}
      title={title}
      type="button"
      aria-pressed={ariaPressed}
      aria-label={ariaLabel}
    >
      {label}
    </button>
  );
};

ToolbarButton.displayName = "ToolbarButton";

/* ------------------------------------------------------------------ */
/*  ToolbarSeparator                                                    */
/* ------------------------------------------------------------------ */

/**
 * Visual separator between toolbar groups.
 */
export const ToolbarSeparator: React.FC = () => (
  <div className="kanava-fb-sep" />
);

ToolbarSeparator.displayName = "ToolbarSeparator";

/* ------------------------------------------------------------------ */
/*  ToolbarGroup                                                        */
/* ------------------------------------------------------------------ */

export interface ToolbarGroupProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Group container for related toolbar items.
 */
export const ToolbarGroup: React.FC<ToolbarGroupProps> = ({
  children,
  className = "",
}) => (
  <div className={`kanava-fb-group ${className}`}>{children}</div>
);

ToolbarGroup.displayName = "ToolbarGroup";

/* ------------------------------------------------------------------ */
/*  ToolbarDropdown                                                     */
/* ------------------------------------------------------------------ */

export interface ToolbarDropdownProps {
  /** Trigger button label. */
  label: React.ReactNode;
  /** Tooltip for the trigger button. */
  title?: string;
  /** Dropdown items. */
  items: ToolbarDropdownItem[];
  /** Editor instance for executing commands & checking isActive. */
  editor: KanavaEditor | null;
  /** Extra CSS class. */
  className?: string;
}

/**
 * A dropdown button that shows a list of selectable items.
 * Each item can execute a ProseMirror command.
 */
export const ToolbarDropdown: React.FC<ToolbarDropdownProps> = ({
  label,
  title,
  items,
  editor,
  className = "",
}) => {
  const [open, setOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const resolveIcon = useResolveIcon();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleItemClick = useCallback(
    (item: ToolbarDropdownItem) => {
      if (!editor) return;
      editor.exec(item.command);
      editor.focus();
      setOpen(false);
    },
    [editor],
  );

  return (
    <div ref={groupRef} className={`kanava-fb-group ${className}`}>
      <button
        className="kanava-fb-btn"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        title={title}
        type="button"
      >
        {label} <span className="kanava-fb-caret"><ChevronDownIcon size={10} /></span>
      </button>
      {open && (
        <div className="kanava-fb-dropdown">
          {items.map((item) => {
            const isActive = item.isActive && editor
              ? item.isActive(editor.pmState)
              : false;
            return (
              <button
                key={item.key}
                className={`kanava-fb-dropdown-item ${isActive ? "active" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleItemClick(item)}
              >
                {item.icon && (
                  <span className="kanava-fb-dropdown-icon">{resolveIcon(item.icon)}</span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

ToolbarDropdown.displayName = "ToolbarDropdown";

/* ------------------------------------------------------------------ */
/*  ToolbarInput — inline text/number input for block attributes        */
/* ------------------------------------------------------------------ */

interface ToolbarInputProps {
  config: NonNullable<ToolbarItem["inputConfig"]>;
  editor: KanavaEditor;
}

/**
 * An inline input field that appears in the block toolbar.
 * Reads its current value from the editor state and commits
 * on Enter or blur.
 */
const ToolbarInput: React.FC<ToolbarInputProps> = ({ config, editor }) => {
  const currentValue = config.getValue(editor.pmState);
  const [value, setValue] = useState(currentValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when external state changes (e.g. after undo)
  useEffect(() => {
    const newVal = config.getValue(editor.pmState);
    setValue(newVal);
  }, [editor.pmState, config]);

  const commit = useCallback(() => {
    const cmd = config.onCommit(value);
    editor.exec(cmd);
    editor.focus();
  }, [config, editor, value]);

  return (
    <input
      ref={inputRef}
      className="kanava-fb-input"
      type={config.inputType}
      placeholder={config.placeholder}
      value={value}
      style={{ width: config.width ? `${config.width}px` : undefined }}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setValue(config.getValue(editor.pmState));
          editor.focus();
        }
        e.stopPropagation();
      }}
      onBlur={commit}
      onMouseDown={(e) => e.stopPropagation()}
    />
  );
};

ToolbarInput.displayName = "ToolbarInput";

/* ------------------------------------------------------------------ */
/*  BlockToolbar — renders block-specific items from ToolbarState       */
/* ------------------------------------------------------------------ */

export interface BlockToolbarProps {
  /** Toolbar items from the selected BlockDefinition. */
  items: readonly ToolbarItem[];
  /** Editor instance. */
  editor: KanavaEditor | null;
  /** Callback for items with no command — receives the item key. */
  onCustomAction?: (key: string) => void;
}

/**
 * Renders a set of `ToolbarItem[]` from a BlockDefinition.
 * Each item is rendered according to its `type` (button, dropdown, toggle, separator, input).
 */
export const BlockToolbar: React.FC<BlockToolbarProps> = ({ items, editor, onCustomAction }) => {
  const resolveIcon = useResolveIcon();
  return (
    <>
      {items.map((item, i) => {
        if (item.type === "separator") {
          return <ToolbarSeparator key={item.key} />;
        }

        if (item.type === "dropdown" && item.items) {
          return (
            <React.Fragment key={item.key}>
              <ToolbarDropdown
                label={item.icon ? resolveIcon(item.icon) : item.label}
                title={item.label}
                items={item.items}
                editor={editor}
              />
              {i < items.length - 1 && <ToolbarSeparator />}
            </React.Fragment>
          );
        }

        if (item.type === "input" && item.inputConfig && editor) {
          return (
            <React.Fragment key={item.key}>
              <ToolbarInput
                config={item.inputConfig}
                editor={editor}
              />
              {i < items.length - 1 && <ToolbarSeparator />}
            </React.Fragment>
          );
        }

        // Default: button or toggle
        const isActive = item.isActive && editor
          ? item.isActive(editor.pmState)
          : false;
        const isEnabled = item.isEnabled && editor
          ? item.isEnabled(editor.pmState)
          : true;

        return (
          <ToolbarButton
            key={item.key}
            label={item.icon ? resolveIcon(item.icon) : item.label}
            title={item.label}
            active={isActive}
            disabled={!isEnabled}
            command={item.command}
            editor={editor}
            danger={item.key.includes("delete")}
            onClick={!item.command && onCustomAction ? () => onCustomAction(item.key) : undefined}
          />
        );
      })}
    </>
  );
};

BlockToolbar.displayName = "BlockToolbar";

/* ── Re-exported primitives (extracted for modularity) ──── */
export { NumberStepper } from "./NumberStepper.js";
export type { NumberStepperProps } from "./NumberStepper.js";
export { SelectDropdown } from "./SelectDropdown.js";
export type { SelectOption, SelectDropdownProps } from "./SelectDropdown.js";
export { SegmentedControl } from "./SegmentedControl.js";
export type { SegmentedOption, SegmentedControlProps } from "./SegmentedControl.js";

