import React, { useEffect, useState, useCallback, useRef } from "react";
import type { KanavaEditor } from "@kanava/editor";
import { ColorPicker } from "./ColorPicker.js";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SeparatorMenuProps {
    editor: KanavaEditor | null;
    className?: string;
}

interface SeparatorState {
    pos: number;
    x: number;
    y: number;
    separatorStyle: "ghost" | "visible";
    separatorColor: string | null;
    separatorWidth: number;
    separatorPadding: number;
}

const COLOR_PRESETS = [
    "#e0e0e0", // light gray
    "#9e9e9e", // gray
    "#424242", // dark gray
    "#4285f4", // blue
    "#0f9d58", // green
    "#f4b400", // yellow
    "#db4437", // red
    "#ab47bc", // purple
];

/* ------------------------------------------------------------------ */
/*  SeparatorMenu                                                      */
/* ------------------------------------------------------------------ */

/**
 * Right-click context menu for column separators.
 *
 * Listens for `kanava:separator-menu` CustomEvent dispatched by
 * ColumnLayoutView on gutter right-click.
 *
 * Provides controls for:
 * - Style toggle (ghost / visible)
 * - Color picker (presets + custom)
 * - Width slider (1–8px)
 */
export const SeparatorMenu: React.FC<SeparatorMenuProps> = ({
    editor,
    className,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const [state, setState] = useState<SeparatorState | null>(null);

    const closeMenu = useCallback(() => {
        setVisible(false);
        setState(null);
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

    // Listen for separator-menu custom event
    useEffect(() => {
        if (!editor) return;
        const dom = editor.pmView.dom;

        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;

            // Position relative to editor container
            const container = dom.closest(".kanava-editor-container") || dom.parentElement!;
            const containerRect = container.getBoundingClientRect();

            setState({
                pos: detail.pos,
                x: detail.x - containerRect.left,
                y: detail.y - containerRect.top,
                separatorStyle: detail.separatorStyle,
                separatorColor: detail.separatorColor,
                separatorWidth: detail.separatorWidth,
                separatorPadding: detail.separatorPadding ?? 0,
            });
            setVisible(true);
        };

        dom.addEventListener("kanava:separator-menu", handler);
        return () => dom.removeEventListener("kanava:separator-menu", handler);
    }, [editor]);

    /**
     * Update separator attrs on the columnLayout node.
     */
    const updateAttrs = useCallback(
        (updates: { separatorStyle?: string; separatorColor?: string | null; separatorWidth?: number; separatorPadding?: number }) => {
            if (!editor || !state) return;

            const pmState = editor.pmState;
            const node = pmState.doc.nodeAt(state.pos);
            if (!node || node.type.name !== "columnLayout") return;

            const tr = pmState.tr.setNodeMarkup(state.pos, undefined, {
                ...node.attrs,
                ...updates,
            });
            editor.pmView.dispatch(tr);
            editor.focus();

            // Update local state to reflect the change
            setState((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    separatorStyle: (updates.separatorStyle as "ghost" | "visible") ?? prev.separatorStyle,
                    separatorColor: updates.separatorColor !== undefined ? updates.separatorColor : prev.separatorColor,
                    separatorWidth: updates.separatorWidth ?? prev.separatorWidth,
                    separatorPadding: updates.separatorPadding ?? prev.separatorPadding,
                };
            });
        },
        [editor, state]
    );

    if (!visible || !state) return null;

    const isVisible = state.separatorStyle === "visible";

    return (
        <div
            ref={menuRef}
            className={`kanava-separator-menu ${className || ""}`}
            style={{
                position: "absolute",
                top: `${state.y}px`,
                left: `${state.x}px`,
                zIndex: 1000,
            }}
        >
            <div className="kanava-sep-menu-header">Separator</div>

            {/* Style toggle */}
            <div className="kanava-sep-menu-row">
                <span className="kanava-sep-menu-label">Style</span>
                <div className="kanava-sep-menu-toggle">
                    <button
                        type="button"
                        className={`kanava-sep-menu-btn ${!isVisible ? "active" : ""}`}
                        onClick={() => updateAttrs({ separatorStyle: "ghost" })}
                    >
                        Hidden
                    </button>
                    <button
                        type="button"
                        className={`kanava-sep-menu-btn ${isVisible ? "active" : ""}`}
                        onClick={() => updateAttrs({ separatorStyle: "visible" })}
                    >
                        Visible
                    </button>
                </div>
            </div>

            {/* Color picker (only when visible) */}
            {isVisible && (
                <div className="kanava-sep-menu-row kanava-sep-menu-color-row">
                    <span className="kanava-sep-menu-label">Color</span>
                    <div onMouseDown={(e) => e.preventDefault()}>
                        <ColorPicker
                            value={state.separatorColor || ""}
                            onChange={(c) => updateAttrs({ separatorColor: c || null })}
                            presets={COLOR_PRESETS}
                            label="Separator color"
                        />
                    </div>
                </div>
            )}

            {/* Width slider (only when visible) */}
            {isVisible && (
                <div className="kanava-sep-menu-row">
                    <span className="kanava-sep-menu-label">Width</span>
                    <input
                        type="range"
                        className="kanava-sep-menu-slider"
                        min={1}
                        max={8}
                        step={1}
                        value={state.separatorWidth}
                        onChange={(e) =>
                            updateAttrs({ separatorWidth: parseInt(e.target.value, 10) })
                        }
                    />
                    <span className="kanava-sep-menu-value">{state.separatorWidth}px</span>
                </div>
            )}

            {/* Spacing slider */}
            <div className="kanava-sep-menu-row">
                <span className="kanava-sep-menu-label">Spacing</span>
                <input
                    type="range"
                    className="kanava-sep-menu-slider"
                    min={0}
                    max={24}
                    step={2}
                    value={state.separatorPadding}
                    onChange={(e) =>
                        updateAttrs({ separatorPadding: parseInt(e.target.value, 10) })
                    }
                />
                <span className="kanava-sep-menu-value">{state.separatorPadding}px</span>
            </div>
        </div>
    );
};

SeparatorMenu.displayName = "KanavaSeparatorMenu";
